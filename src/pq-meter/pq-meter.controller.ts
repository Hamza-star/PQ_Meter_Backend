import { Controller, Get, Query } from '@nestjs/common';
import { PqMeterService } from './pq-meter.service';

@Controller('pq-meter')
export class PqMeterController {
  constructor(private readonly pqMeterService: PqMeterService) {}

  @Get('test')
  async testFindOne() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.pqMeterService.testFindOne();
  }

  @Get('aggregate')
  async aggregate(@Query('interval') interval: string) {
    return this.pqMeterService.aggregateByInterval(interval);
  }

  @Get('latest')
  async latestDocs() {
    return this.pqMeterService.latestDocs(1);
  }
}
