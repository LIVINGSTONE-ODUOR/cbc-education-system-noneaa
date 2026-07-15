// =============================================================================
// campusLocation.controller.js
// Campus Map — a searchable directory of classrooms, labs, library, and
// offices, so students can find where something is.
//
// Table:   campus_locations
// Pattern: matches lostFound.controller.js
// Auth:    Bearer JWT → req.user.schoolId / req.user.role / req.user.id
//
// Scope: viewable by everyone at the school (students, teachers, admins).
// Only teachers and school admins can add/edit/remove entries — students
// browse and search, they don't maintain the directory.
// =============================================================================

const { createClient } = require('@supabase/supabase-js');
const asyncHandler = require('express-async-handler');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const LOCATION_SELECT = `
  id, name, category, building, floor, room_number, description, created_at, updated_at
`;

const canManage = (role) => role === 'teacher' || role === 'school_admin';

// ---------------------------------------------------------------------------
// GET /api/v1/campus-locations
// Query: category ('classroom'|'lab'|'library'|'office'|'other'), q (search
// on name/room_number), building
// School-wide directory, alphabetical by building then name.
// ---------------------------------------------------------------------------
const listLocations = asyncHandler(async (req, res) => {
  const { schoolId } = req.user;
  const { category, building, q } = req.query;

  let query = supabase
    .from('campus_locations')
    .select(LOCATION_SELECT)
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .order('building', { ascending: true })
    .order('name', { ascending: true });

  if (category) {
    query = query.eq('category', category);
  }
  if (building) {
    query = query.eq('building', building);
  }
  if (q && q.trim()) {
    const term = q.trim();
    query = query.or(`name.ilike.%${term}%,room_number.ilike.%${term}%,description.ilike.%${term}%`);
  }

  const { data: locations, error } = await query;

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch campus locations', error: error.message });
  }

  return res.json({ success: true, data: { locations: locations || [] } });
});

// ---------------------------------------------------------------------------
// POST /api/v1/campus-locations
// Body: { name*, category*, building, floor, room_number, description }
// Roles: teacher, school_admin
// ---------------------------------------------------------------------------
const createLocation = asyncHandler(async (req, res) => {
  const { schoolId, role, id: userId } = req.user;

  if (!canManage(role)) {
    return res.status(403).json({ success: false, message: 'Only teachers and school admins can add to the campus map' });
  }

  const { name, category, building, floor, room_number, description } = req.body;
  const VALID_CATEGORIES = ['classroom', 'lab', 'library', 'office', 'other'];

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'name is required' });
  }
  if (!category || !VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ success: false, message: `category must be one of: ${VALID_CATEGORIES.join(', ')}` });
  }

  const { data: location, error } = await supabase
    .from('campus_locations')
    .insert({
      school_id: schoolId,
      name: name.trim(),
      category,
      building: building || null,
      floor: floor || null,
      room_number: room_number || null,
      description: description || null,
      created_by: userId || null,
    })
    .select(LOCATION_SELECT)
    .single();

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to add campus location', error: error.message });
  }

  return res.status(201).json({ success: true, message: 'Location added to the campus map', data: { location } });
});

// ---------------------------------------------------------------------------
// PUT /api/v1/campus-locations/:id
// Body: any of { name, category, building, floor, room_number, description }
// Roles: teacher, school_admin
// ---------------------------------------------------------------------------
const updateLocation = asyncHandler(async (req, res) => {
  const { schoolId, role } = req.user;
  const { id } = req.params;

  if (!canManage(role)) {
    return res.status(403).json({ success: false, message: 'Only teachers and school admins can edit the campus map' });
  }

  const { name, category, building, floor, room_number, description } = req.body;
  const VALID_CATEGORIES = ['classroom', 'lab', 'library', 'office', 'other'];

  if (category && !VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ success: false, message: `category must be one of: ${VALID_CATEGORIES.join(', ')}` });
  }

  const updates = {};
  if (name !== undefined) updates.name = name.trim();
  if (category !== undefined) updates.category = category;
  if (building !== undefined) updates.building = building;
  if (floor !== undefined) updates.floor = floor;
  if (room_number !== undefined) updates.room_number = room_number;
  if (description !== undefined) updates.description = description;

  const { data: location, error } = await supabase
    .from('campus_locations')
    .update(updates)
    .eq('id', id)
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .select(LOCATION_SELECT)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to update campus location', error: error.message });
  }
  if (!location) {
    return res.status(404).json({ success: false, message: 'Campus location not found' });
  }

  return res.json({ success: true, message: 'Location updated', data: { location } });
});

// ---------------------------------------------------------------------------
// DELETE /api/v1/campus-locations/:id
// Roles: teacher, school_admin
// ---------------------------------------------------------------------------
const deleteLocation = asyncHandler(async (req, res) => {
  const { schoolId, role } = req.user;
  const { id } = req.params;

  if (!canManage(role)) {
    return res.status(403).json({ success: false, message: 'Only teachers and school admins can remove entries from the campus map' });
  }

  const { data: location } = await supabase
    .from('campus_locations')
    .select('id')
    .eq('id', id)
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!location) {
    return res.status(404).json({ success: false, message: 'Campus location not found' });
  }

  const { error } = await supabase
    .from('campus_locations')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to remove campus location', error: error.message });
  }

  return res.json({ success: true, message: 'Location removed from the campus map' });
});

module.exports = {
  listLocations,
  createLocation,
  updateLocation,
  deleteLocation,
};
