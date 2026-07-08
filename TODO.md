# TODO

- [ ] Add a minimum skeleton display delay (e.g., 800–1200ms) to LearnerProfile page so skeleton shows for a short time even if API is fast.
- [ ] Remove any global loading spinner/overlay that shows on auth pages *after login*; keep only button-level/loading states on auth routes.
- [x] Replaced full-page loading spinners on protected auth-admin pages with skeleton loaders (Dashboard, Learners).

- [ ] Ensure auth/login success navigation does not keep showing `PageLoader`/spinners after login transition.
- [x] Learner profile skeleton now flexes for a short minimum duration.
- [ ] For all auth-protected components after login that load real DB data: replace “spinner/Loader2 full-page” states with appropriate skeleton components (start with existing skeletons; create new skeletons where missing).

- [ ] Run frontend typecheck/lint and verify key flows: login → dashboard; learner profile → learners.

