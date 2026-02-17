import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators';
import { QueryAnalyzerService } from '../common/services/query-analyzer.service';

@Controller('api/diagnostics')
export class DiagnosticsController {
  constructor(private readonly queryAnalyzer: QueryAnalyzerService) {}

  /**
   * Get slow queries from the last hour
   * Available only when QUERY_LOGGING_ENABLED=true
   *
   * @example
   * GET /api/diagnostics/slow-queries
   * Response: [ { query: "Course.findMany", duration: 450, timestamp: "2026-02-17T03:44:00Z" } ]
   */
  @Public()
  @Get('slow-queries')
  getSlowQueries() {
    return this.queryAnalyzer.getSlowQueries(50);
  }

  /**
   * Get query statistics aggregated by model
   *
   * @example
   * GET /api/diagnostics/query-stats
   * Response: {
   *   totalQueries: 1523,
   *   slowestQuery: { query: "Course.findMany", duration: 523 },
   *   byModel: {
   *     Course: { count: 245, totalDuration: 23450, avgDuration: 95.7 }
   *   }
   * }
   */
  @Public()
  @Get('query-stats')
  getQueryStats() {
    return this.queryAnalyzer.getQueryStats();
  }

  /**
   * Clear query logs
   * Useful for isolating specific test scenarios
   */
  @Public()
  @Get('clear-logs')
  clearLogs() {
    this.queryAnalyzer.clearLogs();
    return { message: 'Logs cleared' };
  }
}
