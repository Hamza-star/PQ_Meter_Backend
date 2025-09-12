import { Controller, Get, Query } from '@nestjs/common';
import { HistoricalService } from './historical.service';

@Controller('historical')
export class HistoricalController {
  constructor(private readonly historicalService: HistoricalService) {}

  @Get('trends')
  async getTrends(
    @Query('target') target: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    if (!target || !from || !to) {
      return { error: 'target, from, and to are required' };
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    return this.historicalService.getTrends(target, fromDate, toDate);
  }
}
