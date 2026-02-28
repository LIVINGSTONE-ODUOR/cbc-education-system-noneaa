# Login Fix TODO

## Tasks:
- [ ] 1. Update AuthContext to properly handle API URL and accept role parameter
- [ ] 2. Update LoginPage to pass userType/role to the login function
- [ ] 3. Verify the backend accepts the role parameter (optional)

## Issues Found:
1. LoginPage has userType state but it's NOT sent to backend during login
2. API URL configuration may not be properly set
3. The role selection in LoginPage is only used for navigation after login, not for authentication
