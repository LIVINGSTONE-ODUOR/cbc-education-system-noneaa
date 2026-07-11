const listTeacherAssignments = asyncHandler(async (req, res) => {
  const { schoolId, role, id: actorId } = req.user;
  const { id: teacherId } = req.params;
  const { academic_year_id, include_inactive } = req.query;

  const { data: teacher } = await supabase
    .from('teachers')
    .select('id, user_id')
    .eq('id', teacherId)
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!teacher) {
    return res.status(404).json({ success: false, message: 'Teacher not found' });
  }

  const isAdmin = ['school_admin', 'super_admin'].includes(role);
  const isSelf = teacher.user_id === actorId;
  if (!isAdmin && !isSelf) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }

  const buildAssignmentsQuery = (selectStr) => {
    let q = supabase
      .from('teacher_assignments')
      .select(selectStr)
      .eq('teacher_id', teacherId)
      .is('deleted_at', null);

    if (academic_year_id) q = q.eq('academic_year_id', academic_year_id);
    if (include_inactive !== 'true') q = q.eq('is_active', true);

    return q;
  };

  // 1) Try the full query with the deep academic_year/term embeds.
  // ⚠️ Same fragility documented in getTeacher above: these embeds depend
  // on PostgREST resolving specific FK relationships on teacher_assignments.
  // If that lookup fails, Supabase errors out the WHOLE query even though
  // the assignment rows themselves are fine. Fall back to progressively
  // simpler selects instead of surfacing a flat 500.
  const fullSelect = `
    id,
    is_active,
    academic_year_id,
    term_id,
    class:class_id ( id, grade_level, stream_name ),
    learning_area:learning_area_id ( id, name, code ),
    academic_year:academic_year_id ( id, name, is_current ),
    term:term_id ( id, name, term_number )
  `;

  let { data: assignments, error } = await buildAssignmentsQuery(fullSelect);

  if (error) {
    console.error('[listTeacherAssignments] Full join failed, retrying with simpler join:', {
      message: error.message, code: error.code, hint: error.hint, teacherId,
    });

    // 2) Fallback: class + learning_area only, no academic_year/term embed.
    const simplerSelect = `
      id,
      is_active,
      academic_year_id,
      term_id,
      class:class_id ( id, grade_level, stream_name ),
      learning_area:learning_area_id ( id, name, code )
    `;
    ({ data: assignments, error } = await buildAssignmentsQuery(simplerSelect));
  }

  if (error) {
    console.error('[listTeacherAssignments] Simpler join also failed, retrying with no joins:', {
      message: error.message, code: error.code, hint: error.hint, teacherId,
    });

    // 3) Final fallback: raw rows, no embeds at all.
    ({ data: assignments, error } = await buildAssignmentsQuery(
      'id, is_active, academic_year_id, term_id, class_id, learning_area_id'
    ));
  }

  if (error) {
    console.error('[listTeacherAssignments] All fallbacks failed:', {
      message: error.message, code: error.code, hint: error.hint, teacherId,
    });
    return res.status(500).json({ success: false, message: 'Failed to fetch assignments', error: error.message });
  }

  return res.json({ success: true, data: { teacher_id: teacherId, assignments: assignments || [] } });
});
