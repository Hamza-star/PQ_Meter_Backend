// src/meter/meter.scheduler.ts
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MeterService } from './meter.service';

@Injectable()
export class MeterScheduler {
  constructor(private readonly meterService: MeterService) {}

  @Cron('*/1 * * * * *') // every 2 seconds
  async handleCron() {
    await this.meterService.updateSnapshot();
  }
}
