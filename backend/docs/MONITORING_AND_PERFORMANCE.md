# Monitoring & Performance Tracking

## Overview
Comprehensive monitoring and performance tracking system implemented for the JLM E-Learning Platform backend using Winston logging, custom metrics collection, and NestJS Terminus health checks.

## Architecture

### 1. Custom Logger Service (`CustomLoggerService`)
**Location**: `backend/src/common/logger/logger.service.ts`

**Features**:
- **Winston-based structured logging** with JSON format for production
- **Daily log rotation** with automatic compression
- **Separate error logs** retained for 30 days
- **Context-aware logging** for different application components
- **Specialized logging methods** for HTTP requests, database queries, payments, and authentication events

**Log Files**:
- `logs/application-YYYY-MM-DD.log` - All application logs (retained 14 days)
- `logs/error-YYYY-MM-DD.log` - Error logs only (retained 30 days)
- Logs compressed automatically with gzip

**Configuration**:
```env
LOG_LEVEL=info  # Options: error, warn, info, debug, verbose
```

**Usage Examples**:
```typescript
// Inject in any service
constructor(private readonly logger: CustomLoggerService) {}

// Standard logging
this.logger.log('User logged in', 'AuthService');
this.logger.error('Database connection failed', stack, 'PrismaService');

// Specialized logging
this.logger.logRequest('GET', '/api/courses', 200, 145, userId);
this.logger.logPayment('payment_completed', 49.99, 'USD', userId, { courseId });
this.logger.logAuth('login_attempt', userId, true, { ipAddress: req.ip });
this.logger.logPerformance('course_creation', 230, { instructorId });
```

### 2. Performance Middleware (`PerformanceMiddleware`)
**Location**: `backend/src/common/middleware/performance.middleware.ts`

**Features**:
- Tracks request duration for all HTTP requests
- Logs slow requests (>1 second threshold)
- Captures user ID from JWT for authenticated requests
- Records HTTP method, URL, status code, and duration

**Applied to**: All routes (`'*'`)

**Output Example**:
```json
{
  "timestamp": "2026-02-17 03:30:15",
  "context": "HTTP",
  "level": "info",
  "method": "POST",
  "url": "/api/courses",
  "statusCode": 201,
  "duration": "145ms",
  "userId": "clxxx123456"
}
```

### 3. Logging Interceptor (`LoggingInterceptor`)
**Location**: `backend/src/common/interceptors/logging.interceptor.ts`

**Features**:
- Intercepts all controller method executions
- Logs incoming request details (method, URL, body size)
- Tracks operation duration
- Logs errors with stack traces
- Applied globally via `APP_INTERCEPTOR`

**Use Cases**:
- Debugging request/response flow
- Performance profiling of specific endpoints
- Error tracking with full context

### 4. Metrics Service (`MetricsService`)
**Location**: `backend/src/common/services/metrics.service.ts`

**Tracked Metrics**:
- **Requests**: Total, successful, failed, average duration
- **Database**: Query count, average query time, slow queries (>500ms)
- **Cache**: Hits, misses, hit rate percentage
- **Payments**: Total, successful, failed

**Features**:
- In-memory metrics collection
- Automatic hourly snapshots logged to Winston
- Metrics reset every hour
- Slow request/query detection with automatic logging

**API Endpoint**: `GET /api/health/metrics`

**Response Example**:
```json
{
  "requests": {
    "total": 1523,
    "successful": 1498,
    "failed": 25,
    "averageDuration": 187
  },
  "database": {
    "queries": 3421,
    "averageQueryTime": 42,
    "slowQueries": 3
  },
  "cache": {
    "hits": 892,
    "misses": 234,
    "hitRate": 79.22
  },
  "payments": {
    "total": 47,
    "successful": 45,
    "failed": 2
  }
}
```

**Integration**:
```typescript
// Cache tracking (automatic in CacheService)
this.metricsService.trackCacheHit();
this.metricsService.trackCacheMiss();

// Request tracking (automatic in PerformanceMiddleware)
this.metricsService.trackRequest(duration, success);

// Database tracking (manual in services)
const start = Date.now();
await this.prisma.course.findMany();
this.metricsService.trackDatabaseQuery(Date.now() - start);

// Payment tracking (in PaymentService)
this.metricsService.trackPayment(success);
```

### 5. Health Check System
**Location**: `backend/src/health/`

**Endpoints**:
- `GET /api/health` - System health status
- `GET /api/health/metrics` - Performance metrics

**Health Checks**:
1. **Database Connectivity**: Tests Prisma connection with `SELECT 1`
2. **Memory Usage**: Monitors heap usage (512MB threshold)
3. **Disk Space**: Checks available disk space (90% threshold)

**Response Example** (`GET /api/health`):
```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    },
    "memory_heap": {
      "status": "up"
    },
    "disk": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "database": {
      "status": "up"
    },
    "memory_heap": {
      "status": "up"
    },
    "disk": {
      "status": "up"
    }
  }
}
```

## Integration Points

### 1. CacheService Integration
**File**: `backend/src/common/services/cache.service.ts`

Automatically tracks cache hits and misses:
```typescript
async get<T>(key: string): Promise<T | null> {
  const result = await this.redis.get<T>(key);
  if (result !== null) {
    this.metricsService.trackCacheHit();
  } else {
    this.metricsService.trackCacheMiss();
  }
  return result;
}
```

### 2. Global Application Setup
**File**: `backend/src/app.module.ts`

- `MonitoringModule` imported as **global module**
- `PerformanceMiddleware` applied to all routes
- `LoggingInterceptor` registered as `APP_INTERCEPTOR`

### 3. Application Bootstrap
**File**: `backend/src/main.ts`

- Custom Winston logger injected into NestJS application
- Startup logs include health check and metrics URLs
- Replaced default NestJS logger with `CustomLoggerService`

## Monitoring Best Practices

### 1. Log Levels
Use appropriate log levels for different scenarios:
- **error**: System failures, unhandled exceptions
- **warn**: Slow operations, deprecated features, recoverable errors
- **info**: Business events, request logging, state changes
- **debug**: Detailed execution flow, variable values
- **verbose**: All internal operations, fine-grained details

### 2. Context Usage
Always provide context to help identify log source:
```typescript
this.logger.log('Course created', 'CoursesService');
this.logger.error('Failed to send email', error.stack, 'MailerService');
```

### 3. Structured Data
Include relevant metadata in logs:
```typescript
this.logger.logPayment('refund_processed', amount, currency, userId, {
  courseId,
  reason: 'student_request',
  refundMethod: 'original_payment_method',
});
```

### 4. Performance Thresholds
Current thresholds trigger automatic warnings:
- **Slow HTTP requests**: >1000ms
- **Slow database queries**: >500ms
- **Very slow requests**: >2000ms (tracked in metrics)

### 5. Metrics Review
- Access `/api/health/metrics` regularly to monitor trends
- Hourly snapshots logged automatically for historical analysis
- Use external monitoring tools to scrape metrics endpoint

## Deployment Considerations

### Log Storage
- **Development**: Logs stored in `backend/logs/`
- **Production**: Use centralized log aggregation (e.g., ELK Stack, CloudWatch)
- **Retention**: Application logs (14 days), error logs (30 days)

### Performance Impact
- **Minimal overhead**: Asynchronous logging with buffering
- **Memory usage**: Metrics stored in-memory, reset hourly
- **CPU impact**: <1% for typical request volumes

### Security
- Sensitive data NOT logged automatically
- Review custom log statements for PII/secrets
- Ensure log files have restricted permissions (600 or 640)

## Monitoring Dashboards

### Recommended External Tools
1. **Grafana + Prometheus**: Scrape `/api/health/metrics` for visualization
2. **ELK Stack**: Aggregate logs from all instances
3. **Datadog/New Relic**: APM for distributed tracing
4. **Sentry**: Error tracking and alerting

### Custom Metrics Endpoint
Create custom metrics for Prometheus scraping:
```typescript
// Example: Add Prometheus exporter
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

// In app.module.ts imports
PrometheusModule.register({
  defaultMetrics: { enabled: true },
})
```

## Troubleshooting

### Logs Not Appearing
1. Check `LOG_LEVEL` environment variable
2. Verify `logs/` directory exists and is writable
3. Ensure Winston transports are configured correctly

### High Memory Usage
- Metrics reset hourly to prevent unbounded growth
- Check for memory leaks in application code
- Monitor heap size via `/api/health` endpoint

### Slow Request Warnings
- Review database query performance (add indexes)
- Enable caching for frequently accessed data
- Check external API response times
- Profile slow endpoints with `LoggingInterceptor` output

## Next Steps
1. Set up centralized log aggregation (ELK/CloudWatch)
2. Create Grafana dashboards for metrics visualization
3. Configure alerting for error rates and slow requests
4. Implement distributed tracing with OpenTelemetry
5. Add custom business metrics (e.g., course enrollments per hour)

## Related Documentation
- [Database Indexing Strategy](./DATABASE_INDEXING_STRATEGY.md)
- [Caching Strategy](./CACHING_STRATEGY.md)
- [Job Queue Implementation](./JOB_QUEUE.md)
