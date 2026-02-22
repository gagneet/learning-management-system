## 2026-02-19 - [Privilege Escalation & Input Validation in User Creation]
**Vulnerability:** A `CENTER_ADMIN` was able to create a `SUPER_ADMIN` user. Additionally, the API lacked validation for the `role` enum and the existence of the target `centerId`, leading to potential authorization bypasses and database constraint violations.
**Learning:** Security fixes must be holistic. While preventing privilege escalation was the primary goal, the absence of basic input validation for enums and foreign keys created secondary vulnerabilities that could be exploited to bypass logic or crash the service.
**Prevention:** Implement strict schema validation (using enums) and referential integrity checks at the API layer. Always validate that the requester has sufficient state (e.g., a valid `centerId`) before allowing them to delegate that state to others.

## 2026-02-21 - [Multi-tenancy Inconsistency and Info Disclosure]
**Vulnerability:** Tenancy helpers in `lib/tenancy.ts` used inconsistent property names (`centreId` vs `centerId`) when validating sessions, leading to potential functional breakage or logic bypass. Additionally, some API routes leaked raw `error.message` in responses, exposing internal details.
**Learning:** Inconsistent naming conventions (British vs American spelling) in a multi-tenant system are not just a developer nuisance but a security risk. If security utilities don't match the actual data structures (like the session object), they can fail or be bypassed. Standardizing these at the utility layer and hardening them to check for both variants is essential.
**Prevention:** Always verify that security helpers use the exact property names defined in the session/JWT interfaces. Harden input validation to check for all known variants of sensitive fields (e.g., `centerId` and `centreId`). Never return raw error messages to the client.

## 2026-02-23 - [Batch Operations and Tenant Isolation]
**Vulnerability:** Batch API endpoints (like `/api/academic/homework/batch`) often skip the granular validation found in single-resource endpoints. In this case, the batch homework API lacked checks to ensure that all students and courses in the request belonged to the user's center, enabling cross-tenant data injection (IDOR).
**Learning:** Performance optimizations like batching must not come at the cost of security. Validating unique IDs across multiple tables in a multi-tenant system requires careful use of `Promise.all` and set-based comparisons to remain efficient while maintaining isolation.
**Prevention:** Always implement a validation step for batch operations that verifies every provided foreign key belongs to the authorized tenant. Collect unique IDs and perform a bulk query (e.g., `findMany` with `in` filter) to verify ownership before proceeding with `createMany`.

## 2026-02-23 - [CWE-476: NULL Pointer Dereference in Multi-Tenant HW Assignment]
**Vulnerability:** A logic error occurred where `centreId` was derived from the user's session instead of the student's record. For `SUPER_ADMIN` users without a bound `centerId`, this led to `null` value insertions into mandatory columns, causing database constraint violations and potential denial of service for administrative tasks.
**Learning:** Never trust the session to provide valid tenant context for administrative users (like `SUPER_ADMIN`) who operate across tenants. Security-sensitive fields like `centreId` must always be derived from the target resource (student/course) rather than the actor's session.
**Prevention:** Always derive tenant IDs from the primary resource being acted upon. Implement mandatory checks that ensure all resources in a batch belong to the same tenant before deriving the `centreId` from the first item.

## 2026-02-25 - [IDOR in Financial Transactions & Info Disclosure in Admin APIs]
**Vulnerability:** The financial transactions API lacked role-based record filtering, allowing `PARENT` users to see all transactions in their center (IDOR). Additionally, administrative transfer APIs leaked raw `error.message`, exposing internal system details.
**Learning:** Generic "admin" checks are often insufficient when multiple non-admin roles (Parent, Student, Teacher) share the same endpoint. Granular filtering must be applied explicitly to each role. Furthermore, high-privilege APIs (like Export/Import) are high-value targets and must be hardened against even minor information leaks.
**Prevention:** Implement strict `where` clause injection based on user role for all list endpoints. Always suppress detailed error messages in production-ready API responses.
