# Database Indexing Strategy

## Overview
Advanced indexing strategy implemented to optimize query performance across the JLM E-Learning Platform. Composite indexes added based on actual query patterns identified in the services layer.

## Composite Indexes Added

### 1. Enrollment Model
**Query Pattern**: Enrollment verification (used in 8+ places)
```typescript
// Common query: enrollment.findFirst({ where: { userId, courseId }})
@@index([userId, courseId])
```

**Benefit**: Optimizes enrollment checks before allowing access to course content, certificate generation, and payment processing.

**Affected Services**:
- content.service.ts: `getStreamableContent()`
- payment.service.ts: `initiatePayment()`, `handleWebhook()`
- certificate.service.ts: `generateCertificate()`
- student.service.ts: `enrollInCourse()`, `getEnrollments()`

### 2. Progress Model
**Query Patterns**: 
- Progress lookup: `progress.findFirst({ where: { userId, moduleId }})`
- Completed progress queries: `progress.findMany({ where: { userId, completed: true }})`

```typescript
@@index([userId, moduleId])  // Progress lookup
@@index([userId, completed]) // Completed progress queries
```

**Benefit**: Speeds up progress tracking, module completion checks, and course completion verification.

**Affected Services**:
- progress.service.ts: `markCompleted()`, `getModuleProgress()`
- certificate.service.ts: Course completion verification

### 3. Certificate Model
**Query Pattern**: Duplicate certificate checks
```typescript
// Common query: certificate.findFirst({ where: { userId, courseId }})
@@index([userId, courseId])
```

**Benefit**: Prevents duplicate certificate generation and speeds up certificate lookup.

**Affected Services**:
- certificate.service.ts: `generateCertificate()`, `getCertificatesForStudent()`

### 4. Payment Model
**Query Patterns**: Payment history filtering and analytics
```typescript
@@index([userId, status])     // User payment history by status
@@index([userId, createdAt])  // User payment history sorted by date
@@index([courseId, status])   // Course payment analytics
```

**Benefit**: Optimizes payment dashboard queries, transaction history, and financial reporting.

**Affected Services**:
- payment.service.ts: `getAllPayments()` (with pagination and filters)
- admin.service.ts: Payment analytics queries

### 5. Content Model
**Query Pattern**: Content filtering by module and type
```typescript
// Potential query: content.findMany({ where: { moduleId, type: 'VIDEO' }})
@@index([moduleId, type])
```

**Benefit**: Speeds up content listing with type filtering (e.g., "show all videos in this module").

**Affected Services**:
- content.service.ts: `getModuleContent()`
- Future video-only or PDF-only endpoints

### 6. QuizAttempt Model
**Query Patterns**: Quiz history and user attempts
```typescript
@@index([userId, quizId])      // User quiz attempts
@@index([userId, attemptDate]) // User attempt history
```

**Benefit**: Optimizes quiz history queries and prevents duplicate attempts within time windows.

**Affected Services**:
- quizzes.service.ts: `getBestAttempt()`, attempt history queries

### 7. Course Model
**Query Patterns**: Course catalog filtering and search
```typescript
@@index([category, level])     // Course filtering
@@index([isPremium, price])    // Premium course queries
@@index([category, isPremium]) // Course catalog filtering
```

**Benefit**: Speeds up course discovery, catalog browsing, and premium course listings.

**Affected Services**:
- courses.service.ts: `getPublicCourses()` (with category/level filters)
- Future course search and recommendation features

## Index Selection Rationale

### Why Composite Indexes?
1. **Query Coverage**: Single composite index can satisfy queries that filter on both columns
2. **Sort Optimization**: Composite indexes support ORDER BY on indexed columns
3. **Reduced Index Size**: One composite index is smaller than two separate indexes
4. **Cardinality**: Leading column (e.g., userId) has high cardinality, improving selectivity

### Column Order in Composite Indexes
Indexes follow the **"equality first, range second"** principle:
- **Enrollment `[userId, courseId]`**: Both equality filters, userId has higher cardinality
- **Payment `[userId, status]`**: userId (equality), status (equality/range)
- **Payment `[userId, createdAt]`**: userId (equality), createdAt (range/sort)

### Indexes NOT Added
- **Duplicate indexes**: Won't add composite index if `@@unique` already provides it
- **Low-cardinality leading columns**: Avoided indexes like `[isPremium, userId]` (boolean first)
- **Rarely-used queries**: Focused on hot paths identified in code analysis

## Performance Impact Estimates

| Model | Query Type | Before | After | Improvement |
|-------|-----------|--------|-------|-------------|
| Enrollment | Find by user+course | Table scan | Index seek | ~10-100x |
| Progress | Find by user+module | Index scan | Index seek | ~5-20x |
| Payment | User history with filters | Multiple index scans | Single index seek | ~3-10x |
| Course | Catalog filtering | Multiple index scans | Covering index | ~2-5x |

## Migration Requirements

**Migration Command**:
```bash
npx prisma migrate dev --name add_composite_indexes
```

**Production Deployment**:
```bash
# Use shadow database to validate migration
npx prisma migrate deploy
```

**Index Creation Time**: <1 second for empty databases, 5-30 seconds for production databases with 10k+ rows.

## Index Maintenance

### Monitoring
- Use PostgreSQL `pg_stat_user_indexes` to track index usage
- Monitor index size vs. table size ratio (keep < 50%)
- Check for unused indexes after 30 days

### Query to Monitor Index Usage:
```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;
```

## Future Optimization Opportunities

1. **Full-Text Search**: Add GIN indexes for course title/description search
2. **Partial Indexes**: Index only active enrollments or completed payments
3. **Covering Indexes**: Include non-indexed columns in index for index-only scans
4. **Index Compression**: Enable PostgreSQL BTREE index compression for large text columns

## Testing Recommendations

1. **Query Performance**: Use `EXPLAIN ANALYZE` to verify index usage
2. **Load Testing**: Benchmark common queries with 100k+ rows
3. **Index Bloat**: Monitor index size growth over time
4. **Write Performance**: Verify insert/update operations not significantly degraded

## Related Documentation
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#index)
- [PostgreSQL Index Types](https://www.postgresql.org/docs/current/indexes-types.html)
- [Database Performance Monitoring](./PERFORMANCE_MONITORING.md) (Task 3.8)
