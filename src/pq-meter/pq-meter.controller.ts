import { Controller, Get, Query } from '@nestjs/common';
import { PqMeterService } from './pq-meter.service';

@Controller('pq-meter')
export class PqMeterController {
  constructor(private readonly pqMeterService: PqMeterService) {}

  // Aggregation endpoint
  @Get('trend')
  async getTrend(@Query('interval') interval: string) {
    return this.pqMeterService.aggregateByInterval(interval);
  }

  // Latest documents endpoint
  @Get('latest')
  async latest(@Query('limit') limit?: string) {
    const l = limit ? parseInt(limit) : 10;
    return this.pqMeterService.latestDocs(l);
  }
}
