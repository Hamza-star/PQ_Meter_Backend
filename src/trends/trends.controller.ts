import { Controller, Get, Query } from '@nestjs/common';
import { TrendsService } from './trends.service';

@Controller('graph')
export class TrendsController {
  constructor(private readonly trendsService: TrendsService) {}

  // Today
  @Get('trend/today')
  async getToday(
    @Query('parameter') parameter: 'Voltage' | 'Current' | 'Power',
  ) {
    return this.trendsService.getTrend(parameter, 'today');
  }

  // Yesterday
  @Get('trend/yesterday')
  async getYesterday(
    @Query('parameter') parameter: 'Voltage' | 'Current' | 'Power',
  ) {
    return this.trendsService.getTrend(parameter, 'yesterday');
  }

  // This Week
  @Get('trend/thisWeek')
  async getThisWeek(
    @Query('parameter') parameter: 'Voltage' | 'Current' | 'Power',
  ) {
    return this.trendsService.getTrend(parameter, 'thisWeek');
  }

  // Last 7 Days
  @Get('trend/last7Days')
  async getLast7Days(
    @Query('parameter') parameter: 'Voltage' | 'Current' | 'Power',
  ) {
    return this.trendsService.getTrend(parameter, 'last7Days');
  }

  // This Month
  @Get('trend/thisMonth')
  async getThisMonth(
    @Query('parameter') parameter: 'Voltage' | 'Current' | 'Power',
  ) {
    return this.trendsService.getTrend(parameter, 'thisMonth');
  }

  // Last Month
  @Get('trend/lastMonth')
  async getLastMonth(
    @Query('parameter') parameter: 'Voltage' | 'Current' | 'Power',
  ) {
    return this.trendsService.getTrend(parameter, 'lastMonth');
  }

  // This Year
  @Get('trend/thisYear')
  async getThisYear(
    @Query('parameter') parameter: 'Voltage' | 'Current' | 'Power',
  ) {
    return this.trendsService.getTrend(parameter, 'thisYear');
  }
}
