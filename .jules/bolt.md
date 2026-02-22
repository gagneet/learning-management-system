## 2026-02-20 - [Batch API Calls for Bulk Assignments]
**Learning:** Found a common anti-pattern where multiple homework assignments were being created in a sequential loop of `fetch` calls. This led to $O(N \times M)$ network requests (where N is students and M is exercises). By implementing a batch endpoint using Prisma's `createMany`, network overhead was reduced to $O(1)$ and database transactions were consolidated.
**Action:** Always check for `await fetch` inside loops, especially in dashboards or wizards where multiple items can be selected at once. Prefer batch endpoints and Prisma's `createMany` for bulk operations.

## 2026-02-21 - [Optimize Nested Relation Filters in Prisma]
**Learning:** Nested `some` filters in Prisma (e.g., `where: { relation: { some: { otherRelation: { field: value } } } }`) often result in multiple expensive joins or nested `EXISTS` clauses in SQL. This is especially slow on high-cardinality tables like `ExerciseAttempt`.
**Action:** When you already have the related IDs from a previous query in the same request, prefer a flat `in` filter (e.g., `where: { studentId: { in: ids } }`). Even if it breaks parallelism of a single `Promise.all`, the reduction in database complexity is usually a net performance win.

## 2026-02-22 - [Parallelize and Consolidate Student Activity Queries]
**Learning:** Sequential `await` calls for a single student's different activity types (completed, in-progress, recent) lead to unnecessary latency. Combining these into a single `findMany` and using `Promise.all` to fetch other dependent data (like assessments) can reduce RTT significantly.
**Action:** Hunt for endpoints that fetch a student's state sequentially. Consolidate into a single fetch of `ExerciseAttempt` and use `Promise.all` for parallel execution of independent queries.

## 2026-03-05 - [Optimize Tutor Dashboard and Avoid Self-Referencing Fetch]
**Learning:** Initial page loads can be significantly delayed by server-to-server `fetch` calls in Next.js Server Components. Additionally, dashboard queries often aggregate over a tutor's entire history, leading to $O(N)$ performance degradation. By filtering for active enrollments (`completedAt: null`), applying `take` limits, and calling database utilities directly, latency was reduced from >1 minute to sub-second.
**Action:** Always filter by `completedAt: null` for active dashboard analysis. Never use `fetch` to call internal API routes from Server Components; extract logic to shared functions instead.

## 2026-03-06 - [Parallelize Independent Queries in SSR Pages]
**Learning:** Found that the tutor's live session dashboard was fetching 6 sequential database queries, leading to a "waterfall" effect where each RTT added to the total TTFB (Time To First Byte). By grouping these into two parallel stages using `Promise.all`, we reduced the sequential bottleneck from 6 queries to 2.
**Action:** Always identify independent database calls in Server Components and group them into `Promise.all` stages based on their data dependencies.

## 2026-03-07 - [Join Elimination and Tenant Indexing]
**Learning:** Found that several academic API routes were performing relational joins on the `User` table just to filter by `centerId`, despite the models already having a `centreId` field. Replacing these joins with direct column filters significantly simplifies the generated SQL. Additionally, many dashboard queries filter by `completedAt: null` or `status` within a center, making compound indexes like `(centreId, status)` and `(userId, completedAt)` highly effective.
**Action:** Always prefer direct column filters for tenant isolation when the field is available. Use compound indexes for common filter combinations found in dashboard data-fetching logic.

## 2026-03-08 - [Tutor Dashboard Optimization: Aggregations over Full Includes]
**Learning:** Large dashboards often fetch full relation arrays just to display counts (e.g., student counts, lesson counts). Replacing these with Prisma's `_count` aggregation reduces data transfer from $O(N \times M)$ to $O(N)$ and eliminates expensive serialization of unused objects. Additionally, auditing joins in session queries revealed unused user name includes in attendance records.
**Action:** Use `_count` for all relation-length-only displays. Periodically audit the entire data path from query to component to prune unused fields from `include` and `select` blocks.
## 2026-02-21 - [Dashboard Query Optimization: Eliminating Nested Over-fetching]
**Learning:** In Prisma-based applications, deeply nested includes can lead to massive performance degradation if not strictly necessary for the view. The student dashboard was fetching four levels of nested relations (enrollments -> course -> modules -> lessons -> progress), which grew exponentially with the number of courses a student was enrolled in. This data was entirely unused by the dashboard components.
**Action:** Always audit the 'include' blocks in Prisma queries to ensure every level of depth is actually consumed by the UI. Prefer flat queries or shallow includes for dashboard overview pages.
