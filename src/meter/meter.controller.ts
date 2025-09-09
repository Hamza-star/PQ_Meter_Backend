/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Controller, Get } from '@nestjs/common';
import { MeterService } from './meter.service';

interface BasicReadings {
  current: {
    values: Record<string, string>;
    min: Record<string, string>;
    max: Record<string, string>;
    average: number | null;
    unbalance: string | null;
  };
  voltageLN: {
    values: Record<string, string>;
    min: Record<string, string>;
    max: Record<string, string>;
    average: number | null;
  };
  voltageLL: {
    values: Record<string, string>;
    min: Record<string, string>;
    max: Record<string, string>;
    average: number | null;
  };
  power: {
    active: { present: string | null; min: string | null; max: string | null };
    reactive: {
      present: string | null;
      min: string | null;
      max: string | null;
    };
    apparent: {
      present: string | null;
      min: string | null;
      max: string | null;
    };
  };
  powerFactor: { min: string | null; max: string | null; total: string | null };
}

interface VoltageReadings {
  voltageLN: {
    values: Record<string, string>;
    min: Record<string, string>;
    max: Record<string, string>;
    average: number | null;
  };
  voltageLL: {
    values: Record<string, string>;
    min: Record<string, string>;
    max: Record<string, string>;
    average: number | null;
    unbalance: string | null;
  };
}

@Controller('meter')
export class MeterController {
  constructor(private readonly meterService: MeterService) {}

  @Get('snapshot')
  async getSnapshot() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.meterService.getSnapshot();
  }

  // Basic readings route
  @Get('basic-readings')
  async getBasicReadings(): Promise<BasicReadings | { message: string }> {
    const meterData = await this.meterService.getSnapshot();
    if (!meterData?.structured) return { message: 'No data available' };

    const s = meterData.structured;
    const a = meterData.averages;

    return {
      current: {
        values: s.current ?? {},
        min: s.minCurrent ?? {},
        max: s.maxCurrent ?? {},
        average: a?.current ?? null,
        unbalance: s.unbalance?.current ?? null,
      },
      voltageLN: {
        values: s.voltageLN ?? {},
        min: s.minVoltageLN ?? {},
        max: s.maxVoltageLN ?? {},
        average: a?.voltageLN ?? null,
      },
      voltageLL: {
        values: s.voltageLL ?? {},
        min: s.minVoltageLL ?? {},
        max: s.maxVoltageLL ?? {},
        average: a?.voltageLL ?? null,
      },
      power: {
        active: {
          present: s.power?.active?.total ?? null,
          min: s.minPowerTotal?.active ?? null,
          max: s.maxPowerTotal?.active ?? null,
        },
        reactive: {
          present: s.power?.reactive?.total ?? null,
          min: s.minPowerTotal?.reactive ?? null,
          max: s.maxPowerTotal?.reactive ?? null,
        },
        apparent: {
          present: s.power?.apparent?.total ?? null,
          min: s.minPowerTotal?.apparent ?? null,
          max: s.maxPowerTotal?.apparent ?? null,
        },
      },
      powerFactor: {
        min: s.power?.powerFactor?.min ?? null,
        max: s.power?.powerFactor?.max ?? null,
        total: s.power?.powerFactor?.total ?? null,
      },
    };
  }

  // Voltage readings route
  @Get('voltage-readings')
  async getVoltageReadings(): Promise<VoltageReadings | { message: string }> {
    const meterData = await this.meterService.getSnapshot();
    if (!meterData?.structured) return { message: 'No data available' };

    const s = meterData.structured;
    const a = meterData.averages;

    return {
      voltageLN: {
        values: s.voltageLN ?? {},
        min: s.minVoltageLN ?? {},
        max: s.maxVoltageLN ?? {},
        average: a?.voltageLN ?? null,
      },
      voltageLL: {
        values: s.voltageLL ?? {},
        min: s.minVoltageLL ?? {},
        max: s.maxVoltageLL ?? {},
        average: a?.voltageLL ?? null,
        unbalance: s.unbalance?.voltage ?? null,
      },
    };
  }
}
