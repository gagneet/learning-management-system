## 2026-02-20 - [Batch API Calls for Bulk Assignments]
**Learning:** Found a common anti-pattern where multiple homework assignments were being created in a sequential loop of `fetch` calls. This led to $O(N \times M)$ network requests (where N is students and M is exercises). By implementing a batch endpoint using Prisma's `createMany`, network overhead was reduced to $O(1)$ and database transactions were consolidated.
**Action:** Always check for `await fetch` inside loops, especially in dashboards or wizards where multiple items can be selected at once. Prefer batch endpoints and Prisma's `createMany` for bulk operations.

## 2026-02-21 - [Optimize Nested Relation Filters in Prisma]
**Learning:** Nested `some` filters in Prisma (e.g., `where: { relation: { some: { otherRelation: { field: value } } } }`) often result in multiple expensive joins or nested `EXISTS` clauses in SQL. This is especially slow on high-cardinality tables like `ExerciseAttempt`.
**Action:** When you already have the related IDs from a previous query in the same request, prefer a flat `in` filter (e.g., `where: { studentId: { in: ids } }`). Even if it breaks parallelism of a single `Promise.all`, the reduction in database complexity is usually a net performance win.

## 2026-02-22 - [Parallelize and Consolidate Student Activity Queries]
**Learning:** Sequential `await` calls for a single student's different activity types (completed, in-progress, recent) lead to unnecessary latency. Combining these into a single `findMany` and using `Promise.all` to fetch other dependent data (like assessments) can reduce RTT significantly.
**Action:** Hunt for endpoints that fetch a student's state sequentially. Consolidate into a single fetch of `ExerciseAttempt` and use `Promise.all` for parallel execution of independent queries.
