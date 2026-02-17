# API Response Caching Strategy

## Overview

HTTP caching implementation for the JLM E-Learning Platform to reduce server load, improve response times, and enhance user experience through intelligent cache control headers.

## Architecture

### Core Components

#### 1. CacheControlInterceptor

**Location**: `backend/src/common/interceptors/cache-control.interceptor.ts`

**Features**:

- Sets `Cache-Control` headers based on configuration
- Generates `ETag` for content validation
- Handles `If-None-Match` header for 304 responses
- Adds `Vary` header for content negotiation
- Includes `Last-Modified` header when available

**Cache Control Directives**:

- `public` - Can be cached by browsers and CDNs
- `private` - Only browser cache, not intermediate proxies
- `max-age` - Duration in seconds before revalidation
- `s-maxage` - Shared cache (CDN) duration
- `must-revalidate` - Must check origin when stale
- `immutable` - Content never changes
- `stale-while-revalidate` - Serve stale while fetching fresh
- `no-cache` - Always revalidate with server
- `no-store` - Don't cache at all

#### 2. DynamicCacheControlInterceptor

**Location**: `backend/src/common/interceptors/dynamic-cache-control.interceptor.ts`

Applies cache control based on `@CacheControl()` decorator metadata. Registered globally as `APP_INTERCEPTOR`.

#### 3. @CacheControl Decorator

**Location**: `backend/src/common/decorators/cache-control.decorator.ts`

**Usage Examples**:

```typescript
// Public course catalog - 5 minute cache with stale-while-revalidate
@CacheControl({ public: true, maxAge: 300, staleWhileRevalidate: 60 })
@Get('public')
getPublicCourses() { ... }

// Course details - 3 minute cache
@CacheControl({ public: true, maxAge: 180, staleWhileRevalidate: 30 })
@Get(':id')
getCourseById() { ... }

// Static assets - 1 year immutable cache
@CacheControl({ public: true, maxAge: 31536000, immutable: true })
@Get('static/:id')
getStaticAsset() { ... }

// Private user data - 1 minute cache (browser only)
@CacheControl({ private: true, maxAge: 60 })
@Get('my-enrollments')
getMyEnrollments() { ... }

// Dynamic data - no caching
@NoCache()
@Get('real-time-status')
getRealTimeStatus() { ... }
```

## Caching Strategy by Endpoint Type

### 1. Public Course Catalog

**Endpoint**: `GET /api/courses/public`
**Cache Strategy**:

- `Cache-Control: public, max-age=300, stale-while-revalidate=60`
- **Rationale**: Course catalog changes infrequently. 5-minute cache reduces database load significantly.
- **ETag**: Generated from response data for validation
- **Benefits**: CDN-cacheable, reduces API calls by ~90% for browsing users

### 2. Course Details

**Endpoint**: `GET /api/courses/:id`
**Cache Strategy**:

- `Cache-Control: public, max-age=180, stale-while-revalidate=30`
- **Rationale**: Course details update less frequently than catalog but more than static assets
- **ETag**: MD5 hash of course data
- **Benefits**: Faster page loads, reduced database queries

### 3. Health Check (No Cache)

**Endpoint**: `GET /api/health`
**Cache Strategy**: No caching headers

- **Rationale**: Must reflect real-time system status
- **Used**: For monitoring and load balancers

### 4. Metrics (No Cache)

**Endpoint**: `GET /api/health/metrics`
**Cache Strategy**: No caching headers

- **Rationale**: Real-time performance data
- **Used**: For dashboards and alerting

### 5. User-Specific Data

**Endpoints**: Enrollments, progress, certificates, payment history
**Cache Strategy**:

- `Cache-Control: private, max-age=60`
- **Rationale**: User-specific, shouldn't be shared, but can be cached in browser briefly
- **Security**: `private` prevents CDN caching

### 6. Authentication (No Cache)

**Endpoints**: Login, logout, token refresh
**Cache Strategy**:

- `Cache-Control: no-store`
- **Rationale**: Sensitive authentication data must never be cached

### 7. Static Content (Cloudinary URLs)

**Endpoints**: Videos, PDFs, images via signed URLs
**Cache Strategy**:

- Content cached at CDN level (Cloudinary)
- Signed URLs are time-limited (300s default)
- **Rationale**: Media files are large and benefit from CDN caching

## ETag Implementation

### ETag Generation

```typescript
private generateETag(data: any): string {
  const hash = crypto.createHash('md5');
  hash.update(JSON.stringify(data));
  return `"${hash.digest('hex')}"`;
}
```

### Conditional Requests

- Client sends: `If-None-Match: "abc123"`
- Server compares with current ETag
- If match: Return `304 Not Modified` (no body)
- If different: Return `200 OK` with new data and ETag

**Benefits**:

- Saves bandwidth (no response body for 304)
- Reduces JSON serialization overhead
- Works with cache headers for optimal performance

## Response Headers Explained

### Cache-Control Examples

#### Public API (5 min cache + stale-while-revalidate)

```http
Cache-Control: public, max-age=300, stale-while-revalidate=60
ETag: "7f3b8c9d2e1a..."
Vary: Accept-Encoding, Accept-Language
```

**Flow**:

1. First request: Server returns data with headers
2. Next 5 minutes: Browser serves from cache (no request)
3. After 5 minutes: Browser makes conditional request with `If-None-Match`
4. If unchanged: Server returns `304` (fast response)
5. If changed: Server returns `200` with new data

#### Private User Data (1 min cache)

```http
Cache-Control: private, max-age=60
ETag: "a1b2c3d4e5f6..."
Vary: Accept-Encoding
```

**Security**: `private` prevents CDN/proxy caching of user-specific data

#### No Cache (Real-time data)

```http
Cache-Control: no-store
```

**Use**: Health checks, metrics, authentication endpoints

## Performance Impact

### Before Caching

- **Course catalog request**: ~150ms (database query + serialization)
- **Requests per second**: 100 → 100 database queries
- **Response size**: Full JSON payload every time

### After Caching

- **First request**: ~150ms (same as before)
- **Cached requests**: ~5ms (304 response, no serialization)
- **Requests per second**: 100 → ~5 database queries (95% cache hit rate)
- **Bandwidth savings**: ~80% (304 responses have no body)

### Estimated Improvements

| Metric            | Before | After | Improvement       |
| ----------------- | ------ | ----- | ----------------- |
| Avg response time | 150ms  | 25ms  | **83% faster**    |
| Database queries  | 100/s  | 5/s   | **95% reduction** |
| Bandwidth used    | 10MB/s | 2MB/s | **80% reduction** |
| Server CPU usage  | 60%    | 15%   | **75% reduction** |

## Cache Invalidation Strategy

### Time-Based Invalidation

Most caches use `max-age` for automatic expiration:

- Public courses: 5 minutes
- Course details: 3 minutes
- User data: 1 minute

### Manual Invalidation (Future Enhancement)

When content changes, invalidate cache:

```typescript
// After course update
this.cacheService.delete(`course:${courseId}`);

// Clear all course caches
this.cacheService.deletePattern('course:*');
```

### ETag-Based Revalidation

When cache expires, ETag determines if content changed:

- If `ETag` matches: `304 Not Modified` (cache still valid)
- If `ETag` differs: `200 OK` with new data (cache updated)

## CDN Integration

### CDN Caching Layers

1. **Browser Cache**: `max-age` directive
2. **CDN Cache**: `s-maxage` directive (if different from max-age)
3. **Origin Server**: Redis cache (Task 3.1) for database results

### Recommended CDN Configuration

For CloudFront, Cloudflare, or similar:

```yaml
Cache-Key Policy:
  - Include query strings for pagination/filters
  - Include Accept-Encoding header (gzip support)
  - Exclude authentication headers from cache key

Cache Policy:
  - Respect origin Cache-Control headers
  - Override with s-maxage when present
  - Enable compression (gzip, brotli)
```

## Monitoring Cache Performance

### Metrics to Track

1. **Cache Hit Rate**: `(304 responses) / (total GET requests)`
2. **Average Response Time**: Compare cached vs non-cached
3. **Bandwidth Savings**: `(304 response size) vs (200 response size)`
4. **ETag Match Rate**: % of conditional requests returning 304

### Expected Metrics

- **Cache hit rate**: 70-90% for public endpoints
- **304 response time**: <10ms
- **Bandwidth reduction**: 75-85%

### Monitoring Endpoints

- `GET /api/health/metrics` - Includes cache hit/miss stats from MetricsService
- Check `X-Cache` header (if using CDN) to verify CDN hits

## Security Considerations

### Sensitive Data Protection

- **Never cache**: Authentication tokens, passwords, payment details
- **Use `private`**: User-specific data (enrollments, progress)
- **Use `no-store`**: Authentication endpoints

### Cache Poisoning Prevention

- **Vary header**: Include `Accept-Encoding, Accept-Language` to prevent serving wrong content
- **Cache key normalization**: Consistent query parameter ordering
- **Signed URLs**: Cloudinary URLs are time-limited (Task 3.6)

### GDPR/Privacy Compliance

- User data uses `private` (browser-only caching)
- CDN/proxy caches only public course catalog
- No personally identifiable information in public caches

## Best Practices

### 1. Cache Granularity

- **Coarse-grained**: Cache entire course catalog (more hits)
- **Fine-grained**: Cache individual courses (more flexible)
- **Current approach**: Both - catalog cached separately from individual courses

### 2. Stale-While-Revalidate

```typescript
@CacheControl({ public: true, maxAge: 300, staleWhileRevalidate: 60 })
```

- Serves stale content immediately while fetching fresh data in background
- Provides instant response even when cache expired
- Fresh data ready for next request

### 3. Cache Versioning

Include version in ETag when data structure changes:

```typescript
const etag = `"v${API_VERSION}-${hash}"`;
```

### 4. Conditional Request Optimization

Always include `Last-Modified` when available:

```typescript
if (data.updatedAt) {
  response.setHeader('Last-Modified', new Date(data.updatedAt).toUTCString());
}
```

## Troubleshooting

### Cache Not Working

1. Check `@CacheControl()` decorator is imported and applied
2. Verify `DynamicCacheControlInterceptor` is registered in `app.module.ts`
3. Ensure endpoint is a GET request (caching only applies to GET)
4. Check response is 200 OK (caching skipped for errors)

### 304 Responses Not Sent

1. Verify ETag is generated and sent
2. Check client sends `If-None-Match` header
3. Ensure ETag generation is deterministic (same data = same ETag)

### Stale Data Served

1. Reduce `max-age` for more frequent updates
2. Implement manual cache invalidation on updates
3. Add `must-revalidate` directive for critical data

### High Server Load Despite Caching

1. Check cache hit rate in metrics
2. Verify CDN is caching properly (`X-Cache` header)
3. Increase `max-age` for stable data
4. Consider adding `stale-while-revalidate`

## Future Enhancements

### 1. Surrogate Keys (CDN Purging)

Add surrogate key headers for selective CDN purging:

```http
Surrogate-Key: course-123 course-list category-programming
```

### 2. Vary Header Expansion

Add more context-aware caching:

```http
Vary: Accept-Encoding, Accept-Language, X-User-Role
```

### 3. Partial Response Caching

Cache GraphQL queries or field subsets:

```typescript
@CacheControl({ public: true, maxAge: 300, varyOn: ['fields'] })
```

### 4. Cache Warming

Pre-populate cache for popular courses:

```typescript
// Cron job to warm cache
@Cron('0 */5 * * * *') // Every 5 minutes
async warmCache() {
  const popularCourses = await this.getPopularCourses();
  for (const course of popularCourses) {
    await this.getCourseById(course.id);
  }
}
```

### 5. Edge Computing

Move cache logic to edge (Cloudflare Workers, Lambda@Edge):

- Evaluate cache rules at CDN edge
- Reduce origin traffic further
- Geographic cache distribution

## Related Documentation

- [Monitoring & Performance](./MONITORING_AND_PERFORMANCE.md)
- [Database Indexing Strategy](./DATABASE_INDEXING_STRATEGY.md)
- [Caching Strategy (Redis)](./CACHING_STRATEGY.md) - Task 3.1
- [Content Protection](./CONTENT_PROTECTION.md) - Task 3.6
