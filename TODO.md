# TODO

- [ ] Update `Frontend/src/pages/auth/school-admin/learners/AddLearner.tsx` to include `class_id: selectedClassId` in the learner create/update payload.
- [ ] Confirm backend supports `class_id` during update; if not, add enrollment update logic to `Backend/src/controllers/learner.controller.js`.
- [ ] Ensure class counts in `GET /api/v1/classes` match learner enrollments after create/update.
- [ ] Test: create learner → check `/school-admin/learners` current_class and `/school-admin/learners/classes` learner_count.

