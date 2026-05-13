# TODO

## Task: Connect `StaffList.tsx` to backend real teacher data

- [x] Refactor `Frontend/src/pages/teacher/StaffList.tsx` to remove `mockTeachersData`

- [ ] Add state for `teachers`, `loading`, `error`, and backend `pagination`
- [x] Fetch teachers using `getTeachers()` with server-side pagination and search/status

- [ ] Keep subject filtering client-side until backend supports exact subject filter
- [ ] Update stats cards and table data to use fetched teachers
- [ ] Wire delete action to `deleteTeacher()` and refetch on success
- [ ] Verify build/typecheck

