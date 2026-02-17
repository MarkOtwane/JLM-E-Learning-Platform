import { Module } from '@nestjs/common';
import { QueryAnalyzerService } from '../common/services/query-analyzer.service';
import { DiagnosticsController } from './diagnostics.controller';

@Module({
  controllers: [DiagnosticsController],
  providers: [QueryAnalyzerService],
  exports: [QueryAnalyzerService],
})
export class DiagnosticsModule {}
