/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import { Controller, Get } from '@nestjs/common';
import { MeterService } from './meter.service';

@Controller('meter')
export class MeterController {
  constructor(private readonly meterService: MeterService) {}

  // Snapshot route (raw + structured)
  @Get('snapshot')
  async getSnapshot() {
    return this.meterService.getSnapshot();
  }

  // Basic readings route
  @Get('basic-readings')
  async getBasicReadings() {
    const meterData = await this.meterService.getSnapshot();
    if (!meterData?.structured || !meterData?.averages) {
      return { message: 'No data available' };
    }

    const s = meterData.structured;
    const a = meterData.averages;

    return {
      current: {
        values: s.current,
        min: s.minCurrent,
        max: s.maxCurrent,
        'I Average (A)': a['I Average (A)'],
        'Current Unbalance (%)': s['Current Unbalance (%)'],
      },
      voltageLN: {
        values: s.voltageLN,
        min: s.minVoltageLN,
        max: s.maxVoltageLN,
        'Voltage L-N Average (V)': a['Voltage L-N Average (V)'],
        'Max Voltage L-N Average (V)': a.maxVoltageLN,
        'Min Voltage L-N Average (V)': a.minVoltageLN,
      },
      voltageLL: {
        values: s.voltageLL,
        min: s.minVoltageLL,
        max: s.maxVoltageLL,
        'Voltage L-L Average (V)': a['Voltage L-L Average (V)'],
        'Max Voltage L-L Average (V)': a.maxVoltageLL,
        'Min Voltage L-L Average (V)': a.minVoltageLL,
      },
      power: {
        'Active (kW)': {
          present: s.power['Active (kW)'].present,
          min: s.minPowerTotal['Active (kW)'],
          max: s.maxPowerTotal['Active (kW)'],
        },
        'Reactive (kVAR)': {
          present: s.power['Reactive (kVAR)'].present,
          min: s.minPowerTotal['Reactive (kVAR)'],
          max: s.maxPowerTotal['Reactive (kVAR)'],
        },
        'Apparent (kVA)': {
          present: s.power['Apparent (kVA)'].present,
          min: s.minPowerTotal['Apparent (kVA)'],
          max: s.maxPowerTotal['Apparent (kVA)'],
        },
      },
      'Power Factor Total': s.power['Power Factor Total'],
    };
  }

  // Voltage readings route
  @Get('voltage-readings')
  async getVoltageReadings() {
    const meterData = await this.meterService.getSnapshot();
    if (!meterData?.structured || !meterData?.averages) {
      return { message: 'No data available' };
    }

    const s = meterData.structured;
    const a = meterData.averages;

    return {
      voltageLN: {
        values: s.voltageLN,
        min: s.minVoltageLN,
        max: s.maxVoltageLN,
        'Voltage L-N Average (V)': a['Voltage L-N Average (V)'],
      },
      voltageLL: {
        values: s.voltageLL,
        min: s.minVoltageLL,
        max: s.maxVoltageLL,
        'Voltage L-L Average (V)': a['Voltage L-L Average (V)'],
      },
      'Voltage Unbalance (%)': s['Voltage Unbalance (%)'],
      'Max Voltage L-N Average (V)': a.maxVoltageLN,
      'Max Voltage L-L Average (V)': a.maxVoltageLL,
      'Min Voltage L-N Average (V)': a.minVoltageLN,
      'Min Voltage L-L Average (V)': a.minVoltageLL,
    };
  }
}
