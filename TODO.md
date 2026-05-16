# TODO

- [ ] Inspect Vercel + proxy routing configs (Frontend `vercel.json`, Frontend `vite.config.ts`, Backend `vercel.json`) to confirm `/api/v1/*` is served from same origin.
- [x] Fix/harden backend CORS logic in `Backend/src/app.js` and ensure preflight handling matches the CORS middleware behavior.
- [x] Backend CORS/preflight logic updated to use a single allow decision + origin normalization.
- [ ] Re-test login from `https://cbc-education-system-a478.vercel.app` ensuring preflight succeeds and POST `/api/v1/login` returns 200.



