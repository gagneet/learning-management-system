## 2025-05-14 - [Privilege Escalation in User Creation]
**Vulnerability:** A `CENTER_ADMIN` was able to create a `SUPER_ADMIN` user by passing `role: "SUPER_ADMIN"` in the `POST /api/users` request body.
**Learning:** While the API correctly restricted `CENTER_ADMIN` to creating users within their own center, it failed to validate the `role` field against the requester's own privileges.
**Prevention:** Implement explicit server-side checks in user management APIs to ensure that role assignment doesn't exceed the requester's own authority. Always validate sensitive fields like `role` or `permissions` independently of multi-tenancy filters.
