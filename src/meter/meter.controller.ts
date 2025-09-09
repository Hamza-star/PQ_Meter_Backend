// src/meter/meter.controller.ts
import { Controller, Get } from '@nestjs/common';
import { MeterService } from './meter.service';

@Controller('meter')
export class MeterController {
  constructor(private readonly meterService: MeterService) {}

  @Get('snapshot')
  async getSnapshot() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.meterService.getSnapshot();
  }
}
