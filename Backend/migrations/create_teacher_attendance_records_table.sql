-- =============================================================================
-- create_teacher_attendance_records_table.sql
-- Backs the Teacher Attendance feature:
--   Backend/src/controllers/attendance.controller.js (getTeacherRoster / saveTeacherAttendance)
--   Frontend/src/pages/Attendance/TeacherAttendance
--
-- Mirrors attendance_records (learner attendance) but keys off teachers
-- instead of classes/learners.
-- =============================================================================

CREATE TABLE IF NOT EXISTS teacher_attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  check_in_time TIME,
  check_out_time TIME,
  remarks TEXT,
  marked_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One attendance row per teacher, per day. Also the conflict target for
  -- the controller's Supabase .upsert() call.
  CONSTRAINT teacher_attendance_records_unique_day UNIQUE (teacher_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_teacher_attendance_school_id ON teacher_attendance_records(school_id);
CREATE INDEX IF NOT EXISTS idx_teacher_attendance_date ON teacher_attendance_records(attendance_date);
CREATE INDEX IF NOT EXISTS idx_teacher_attendance_teacher_id ON teacher_attendance_records(teacher_id);

CREATE OR REPLACE FUNCTION set_teacher_attendance_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_teacher_attendance_records_updated_at ON teacher_attendance_records;
CREATE TRIGGER trg_teacher_attendance_records_updated_at
  BEFORE UPDATE ON teacher_attendance_records
  FOR EACH ROW
  EXECUTE FUNCTION set_teacher_attendance_records_updated_at();

ALTER TABLE teacher_attendance_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS teacher_attendance_records_school_isolation ON teacher_attendance_records;
CREATE POLICY teacher_attendance_records_school_isolation ON teacher_attendance_records
  USING (school_id = (current_setting('request.jwt.claims', true)::json->>'school_id')::uuid);

-- Note: the backend controller uses the Supabase service-role key, which
-- bypasses RLS, so this policy protects any future direct/anon access
-- without affecting the existing API routes.
