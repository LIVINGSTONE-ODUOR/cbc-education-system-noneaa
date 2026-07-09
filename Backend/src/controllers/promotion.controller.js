// =============================================================================
// promotion.controller.js
// Promotions & Graduations — batch decision cycles for learners
//
// Tables:  promotion_batches, promotion_batch_learners
// Joins:   academic_years, classes, learners
// Pattern: matches exam.controller.js / class.controller.js
// Auth:    Bearer JWT → req.user.schoolId / req.user.role / req.user.id
// =============================================================================

const { createClient } = require('@supabase/supabase-js');
const asyncHandler = require('express-async-handler');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const KINDS = ['promotion', 'graduation'];
const STATUSES = ['draft', 'ready', 'running', 'completed', 'locked', 'cancelled'];

const paginate = (query, page = 1, limit = 20) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  return query.range(from, to);
};

const BATCH_SELECT = `
  *,
  academic_years:academic_year_id (id, name, year, is_current, is_active)
`;

// =============================================================================
// 1. POST /api/v1/promotions
//    Create a new promotion/graduation batch (status starts as 'draft')
// =============================================================================
const createBatch = asyncHandler(async (req, res) => {
  const { schoolId, role, id: userId } = req.user;

  if (!['school_admin', 'super_admin'].includes(role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }

  const {
    kind,
    academic_year_id,
    grade_level,
    stream_name,
    to_grade_level,
    criteria,
    effective_date,
  } = req.body;

  const errors = [];
  if (!kind || !KINDS.includes(kind)) errors.push(`kind must be one of: ${KINDS.join(', ')}`);
  if (!academic_year_id) errors.push('academic_year_id is required');
  if (!grade_level) errors.push('grade_level is required');
  if (!criteria || criteria.trim().length < 10) errors.push('criteria is required (min 10 chars)');
  if (!effective_date) errors.push('effective_date is required');
  if (kind === 'promotion' && !to_grade_level) {
    errors.push('to_grade_level is required for promotion batches');
  }

  if (errors.length) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }

  // Count eligible learners (target) from current enrollments matching grade/stream/year
  let learnerQuery = supabase
    .from('learner_enrollments')
    .select('learner_id', { count: 'exact', head: true })
    .eq('school_id', schoolId)
    .eq('academic_year_id', academic_year_id)
    .eq('status', 'enrolled');

  const { count: targetCount } = await learnerQuery;

  const { data: batch, error } = await supabase
    .from('promotion_batches')
    .insert({
      school_id: schoolId,
      kind,
      academic_year_id,
      grade_level,
      stream_name: stream_name || null,
      to_grade_level: kind === 'promotion' ? to_grade_level : null,
      criteria: criteria.trim(),
      effective_date,
      learner_count_target: targetCount || 0,
      status: 'draft',
      created_by: userId,
    })
    .select(BATCH_SELECT)
    .single();

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to create batch', error: error.message });
  }

  return res.status(201).json({ success: true, message: 'Batch created', data: batch });
});

// =============================================================================
// 2. GET /api/v1/promotions
//    List batches with filtering + pagination
// =============================================================================
const listBatches = asyncHandler(async (req, res) => {
  const { schoolId } = req.user;
  const { kind, status, academic_year_id, grade_level, search, page = 1, limit = 20 } = req.query;

  let query = supabase
    .from('promotion_batches')
    .select(BATCH_SELECT, { count: 'exact' })
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });

  if (kind) query = query.eq('kind', kind);
  if (status) query = query.eq('status', status);
  if (academic_year_id) query = query.eq('academic_year_id', academic_year_id);
  if (grade_level) query = query.eq('grade_level', grade_level);
  if (search) query = query.ilike('criteria', `%${search}%`);

  const { data, error, count } = await paginate(query, Number(page), Number(limit));

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to list batches', error: error.message });
  }

  return res.json({
    success: true,
    data,
    pagination: { page: Number(page), limit: Number(limit), total: count },
  });
});

// =============================================================================
// 3. GET /api/v1/promotions/:id
// =============================================================================
const getBatch = asyncHandler(async (req, res) => {
  const { schoolId } = req.user;
  const { id } = req.params;

  const { data: batch, error } = await supabase
    .from('promotion_batches')
    .select(BATCH_SELECT)
    .eq('id', id)
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .single();

  if (error || !batch) {
    return res.status(404).json({ success: false, message: 'Batch not found' });
  }

  const { data: learnerRows } = await supabase
    .from('promotion_batch_learners')
    .select('*, learners:learner_id (id, first_name, last_name, admission_number)')
    .eq('batch_id', id);

  return res.json({ success: true, data: { ...batch, learners: learnerRows || [] } });
});

// =============================================================================
// 4. POST /api/v1/promotions/:id/run
//    Selects eligible learners, records decisions, moves status -> completed
// =============================================================================
const runBatch = asyncHandler(async (req, res) => {
  const { schoolId, role, id: userId } = req.user;
  const { id } = req.params;

  if (!['school_admin', 'super_admin'].includes(role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }

  const { data: batch, error: fetchError } = await supabase
    .from('promotion_batches')
    .select('*')
    .eq('id', id)
    .eq('school_id', schoolId)
    .single();

  if (fetchError || !batch) {
    return res.status(404).json({ success: false, message: 'Batch not found' });
  }
  if (!['draft', 'ready', 'cancelled'].includes(batch.status)) {
    return res.status(409).json({ success: false, message: `Cannot run a batch in status '${batch.status}'` });
  }

  await supabase.from('promotion_batches').update({ status: 'running', updated_by: userId }).eq('id', id);

  // Find learners enrolled in this grade/stream/year
  let enrollQuery = supabase
    .from('learner_enrollments')
    .select('learner_id, class_id, classes:class_id (id, grade_level, stream_name)')
    .eq('school_id', schoolId)
    .eq('academic_year_id', batch.academic_year_id)
    .eq('status', 'enrolled');

  const { data: enrollments, error: enrollError } = await enrollQuery;

  if (enrollError) {
    await supabase.from('promotion_batches').update({ status: 'draft' }).eq('id', id);
    return res.status(500).json({ success: false, message: 'Failed to fetch learners', error: enrollError.message });
  }

  const matched = (enrollments || []).filter((e) => {
    const c = e.classes;
    if (!c || c.grade_level !== batch.grade_level) return false;
    if (batch.stream_name && c.stream_name !== batch.stream_name) return false;
    return true;
  });

  // Resolve destination class for promotions (same stream, to_grade_level)
  let toClassId = null;
  if (batch.kind === 'promotion') {
    const { data: toClass } = await supabase
      .from('classes')
      .select('id')
      .eq('school_id', schoolId)
      .eq('academic_year_id', batch.academic_year_id)
      .eq('grade_level', batch.to_grade_level)
      .eq('stream_name', batch.stream_name || null)
      .maybeSingle();
    toClassId = toClass?.id || null;
  }

  const decision = batch.kind === 'graduation' ? 'graduated' : 'promoted';
  const rows = matched.map((e) => ({
    batch_id: id,
    learner_id: e.learner_id,
    from_class_id: e.class_id,
    to_class_id: batch.kind === 'promotion' ? toClassId : null,
    decision,
  }));

  if (rows.length) {
    const { error: insertError } = await supabase
      .from('promotion_batch_learners')
      .upsert(rows, { onConflict: 'batch_id,learner_id' });

    if (insertError) {
      await supabase.from('promotion_batches').update({ status: 'draft' }).eq('id', id);
      return res.status(500).json({ success: false, message: 'Failed to record learner decisions', error: insertError.message });
    }
  }

  const { data: updatedBatch, error: updateError } = await supabase
    .from('promotion_batches')
    .update({
      status: 'completed',
      learner_count_selected: rows.length,
      learner_count_completed: rows.length,
      updated_by: userId,
    })
    .eq('id', id)
    .select(BATCH_SELECT)
    .single();

  if (updateError) {
    return res.status(500).json({ success: false, message: 'Failed to finalize batch', error: updateError.message });
  }

  return res.json({ success: true, message: 'Batch run completed', data: updatedBatch });
});

// =============================================================================
// 5. POST /api/v1/promotions/:id/lock  |  /unlock
// =============================================================================
const setLockState = (locked) => asyncHandler(async (req, res) => {
  const { schoolId, role, id: userId } = req.user;
  const { id } = req.params;

  if (!['school_admin', 'super_admin'].includes(role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }

  const { data: batch, error: fetchError } = await supabase
    .from('promotion_batches')
    .select('status')
    .eq('id', id)
    .eq('school_id', schoolId)
    .single();

  if (fetchError || !batch) {
    return res.status(404).json({ success: false, message: 'Batch not found' });
  }

  if (locked && batch.status !== 'completed') {
    return res.status(409).json({ success: false, message: 'Only a completed batch can be locked' });
  }
  if (!locked && batch.status !== 'locked') {
    return res.status(409).json({ success: false, message: 'Batch is not locked' });
  }

  // Locking a promotion batch commits learners.grade_level / class to the new class
  if (locked) {
    const { data: rows } = await supabase
      .from('promotion_batch_learners')
      .select('learner_id, to_class_id, decision')
      .eq('batch_id', id);

    for (const row of rows || []) {
      if (row.decision === 'promoted' && row.to_class_id) {
        await supabase.from('learners').update({ current_class_id: row.to_class_id }).eq('id', row.learner_id);
      }
      if (row.decision === 'graduated') {
        await supabase.from('learners').update({ status: 'graduated' }).eq('id', row.learner_id);
      }
    }
  }

  const { data: updated, error } = await supabase
    .from('promotion_batches')
    .update({
      status: locked ? 'locked' : 'completed',
      locked_at: locked ? new Date().toISOString() : null,
      updated_by: userId,
    })
    .eq('id', id)
    .select(BATCH_SELECT)
    .single();

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to update lock state', error: error.message });
  }

  return res.json({ success: true, message: locked ? 'Batch locked' : 'Batch unlocked', data: updated });
});

// =============================================================================
// 6. DELETE /api/v1/promotions/:id  (soft delete, draft/cancelled only)
// =============================================================================
const deleteBatch = asyncHandler(async (req, res) => {
  const { schoolId, role, id: userId } = req.user;
  const { id } = req.params;

  if (!['school_admin', 'super_admin'].includes(role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }

  const { data: batch } = await supabase
    .from('promotion_batches')
    .select('status')
    .eq('id', id)
    .eq('school_id', schoolId)
    .single();

  if (!batch) {
    return res.status(404).json({ success: false, message: 'Batch not found' });
  }
  if (!['draft', 'ready', 'cancelled'].includes(batch.status)) {
    return res.status(409).json({ success: false, message: 'Only draft/ready/cancelled batches can be deleted' });
  }

  const { error } = await supabase
    .from('promotion_batches')
    .update({ deleted_at: new Date().toISOString(), deleted_by: userId })
    .eq('id', id);

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete batch', error: error.message });
  }

  return res.json({ success: true, message: 'Batch deleted' });
});

module.exports = {
  createBatch,
  listBatches,
  getBatch,
  runBatch,
  lockBatch: setLockState(true),
  unlockBatch: setLockState(false),
  deleteBatch,
};
