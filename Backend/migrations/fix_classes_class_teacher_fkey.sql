BEGIN;

ALTER TABLE classes
  DROP CONSTRAINT classes_class_teacher_fkey;

ALTER TABLE classes
  ADD CONSTRAINT classes_class_teacher_fkey
  FOREIGN KEY (class_teacher_id)
  REFERENCES teachers(id)
  ON DELETE SET NULL;

COMMIT;
