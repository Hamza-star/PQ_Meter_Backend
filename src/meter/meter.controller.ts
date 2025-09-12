/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import { Controller, Get } from '@nestjs/common';
import { MeterService } from './meter.service';

@Controller('meter')
export class MeterController {
  constructor(private readonly meterService: MeterService) {}

  @Get('snapshot')
  async getSnapshot() {
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

        min: s.minCurrent, // structured values
        max: s.maxCurrent, // structured values

        'I Average (A)': a['I Average (A)'],
        'Max I Average': a.maxCurrent ?? null, // average max
        'Min I Average': a.minCurrent ?? null, // average min
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
        maxVoltageLN: a.maxVoltageLN, // overall max avg
        minVoltageLN: a.minVoltageLN, // overall min avg
      },
      voltageLL: {
        present: s.voltageLL,
        min: s.minVoltageLL,
        max: s.maxVoltageLL,
        'Voltage L-L Average (V)': a['Voltage L-L Average (V)'],
        maxVoltageLL: a.maxVoltageLL, // overall max avg
        minVoltageLL: a.minVoltageLL, // overall min avg
      },
      'Voltage Unbalance (%)': s['Voltage Unbalance (%)'],
    };
  }

  @Get('demand-readings')
  async getDemand() {
    const snapshot = await this.meterService.getSnapshot();
    if (!snapshot?.structured?.demandReadings) return {};

    return snapshot.structured.demandReadings;
  }
  @Get('energy-readings')
  async getEnergy() {
    const snapshot = await this.meterService.getSnapshot();
    if (!snapshot?.structured?.energyReadings) return {};
    return snapshot.structured.energyReadings.present;
  }

  @Get('waveform/voltage')
  async getVoltageWaveforms() {
    const waveforms = await this.meterService.getWaveforms();
    if (!waveforms?.voltage) return { message: 'No waveform data available' };
    return waveforms.voltage;
  }

  @Get('waveform/current')
  async getCurrentWaveforms() {
    const waveforms = await this.meterService.getWaveforms();
    if (!waveforms?.current) return { message: 'No waveform data available' };
    return waveforms.current;
  }
}
