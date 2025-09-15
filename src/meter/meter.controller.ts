/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
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

  @Get('power-quality')
  async getPowerQuality() {
    const meterData = await this.meterService.getSnapshot();
    if (!meterData?.structured) return { message: 'No data available' };

    const s = meterData.structured;

    return {
      voltageTHD: s.voltageTHD,
      currentTHD: s.currentTHD,
      kFactor: s.kFactor,
      crestFactor: s.crestFactor,
    };
  }

  @Get('basic-readings')
  async getBasicReadings() {
    const meterData = await this.meterService.getSnapshot();
    if (!meterData?.structured || !meterData?.averages)
      return { message: 'No data available' };

    const s = meterData.structured;
    const a = meterData.averages;

    return {
      current: {
        present: s.current,
        min: s.minCurrent,
        max: s.maxCurrent,
        'I Average (A)': a['I Average (A)'],
        'Max I Average': a.maxCurrent ?? null,
        'Min I Average': a.minCurrent ?? null,
        'Current Unbalance (%)': s['Current Unbalance (%)'],
      },
      voltageLN: {
        averages: {
          present: a['Voltage L-N Average (V)'],
          min: a.minVoltageLN,
          max: a.maxVoltageLN,
        },
      },
      voltageLL: {
        averages: {
          present: a['Voltage L-L Average (V)'],
          min: a.minVoltageLL,
          max: a.maxVoltageLL,
        },
      },
      power: {
        'Active (kW)': {
          present: s.power['Active (kW)']?.present ?? null,
          min: s.minPowerTotal['Active (kW)'] ?? null,
          max: s.maxPowerTotal['Active (kW)'] ?? null,
        },
        'Reactive (kVAR)': {
          present: s.power['Reactive (kVAR)']?.present ?? null,
          min: s.minPowerTotal['Reactive (kVAR)'] ?? null,
          max: s.maxPowerTotal['Reactive (kVAR)'] ?? null,
        },
        'Apparent (kVA)': {
          present: s.power['Apparent (kVA)']?.present ?? null,
          min: s.minPowerTotal['Apparent (kVA)'] ?? null,
          max: s.maxPowerTotal['Apparent (kVA)'] ?? null,
        },
      },
      'Power Factor Total': s.power['Power Factor Total'],
    };
  }

  @Get('voltage-readings')
  async getVoltageReadings() {
    const meterData = await this.meterService.getSnapshot();
    if (!meterData?.structured || !meterData?.averages)
      return { message: 'No data available' };

    const s = meterData.structured;
    const a = meterData.averages;

    return {
      voltageLN: {
        present: s.voltageLN,
        min: s.minVoltageLN,
        max: s.maxVoltageLN,
        'Voltage L-N Average (V)': a['Voltage L-N Average (V)'],
        maxVoltageLN: a.maxVoltageLN,
        minVoltageLN: a.minVoltageLN,
      },
      voltageLL: {
        present: s.voltageLL,
        min: s.minVoltageLL,
        max: s.maxVoltageLL,
        'Voltage L-L Average (V)': a['Voltage L-L Average (V)'],
        maxVoltageLL: a.maxVoltageLL,
        minVoltageLL: a.minVoltageLL,
      },
      'Voltage Unbalance (%)': s['Voltage Unbalance (%)'],
    };
  }

  @Get('demand-readings')
  async getDemand() {
    const snapshot = await this.meterService.getSnapshot();
    if (!snapshot?.structured?.demandReadings) return {};
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return snapshot.structured.demandReadings;
  }

  @Get('energy-readings')
  async getEnergy() {
    const snapshot = await this.meterService.getSnapshot();
    if (!snapshot?.structured?.energyReadings) return {};
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return snapshot.structured.energyReadings.present;
  }
}
