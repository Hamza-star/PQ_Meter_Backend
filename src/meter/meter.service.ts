/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import { Snapshot, SnapshotDocument } from './schema/snapshot.schema';

@Injectable()
export class MeterService {
  private readonly logger = new Logger(MeterService.name);

  constructor(
    @InjectModel(Snapshot.name) private snapshotModel: Model<SnapshotDocument>,
  ) {}

  // Fetch Node-RED data
  async fetchNodeRedData(): Promise<any> {
    try {
      const response = await axios.get('http://127.0.0.1:1880/realtimelink');
      return response.data.Meter_Data;
    } catch (err) {
      this.logger.error('Failed to fetch Node-RED data', err);
      return null;
    }
  }

  // Remove timestamps recursively
  private cleanData(data: any): any {
    if (!data || typeof data !== 'object') return data;
    const cleaned: any = Array.isArray(data) ? [] : {};
    for (const key of Object.keys(data)) {
      if (key.toLowerCase().includes('timestamp')) continue;
      cleaned[key] = this.cleanData(data[key]);
    }
    return cleaned;
  }

  // Transform raw → structured
  private transformData(raw: any) {
    const structured = {
      voltageLN: {
        'Vln a (V)': raw['SAH_MTO_PQM1_VOLTAGE_LINE_1_V'],
        'Vln b (V)': raw['SAH_MTO_PQM1_VOLTAGE_LINE_2_V'],
        'Vln c (V)': raw['SAH_MTO_PQM1_VOLTAGE_LINE_3_V'],
      },
      voltageLL: {
        'Vll ab (V)': raw['SAH_MTO_PQM1_VOLTAGE_LINE_1_2_V'],
        'Vll bc (V)': raw['SAH_MTO_PQM1_VOLTAGE_LINE_2_3_V'],
        'lVll ca (V)': raw['SAH_MTO_PQM1_VOLTAGE_LINE_3_1_V'],
      },
      current: {
        'I a (A)': raw['SAH_MTO_PQM1_CURRENT_LINE_1_A'],
        'I b (A)': raw['SAH_MTO_PQM1_CURRENT_LINE_2_A'],
        'I c (A)': raw['SAH_MTO_PQM1_CURRENT_LINE_3_A'],
      },
      power: {
        'Active (kW)': {
          P1: raw['SAH_MTO_PQM1_ACTIVE_POWER_P1_KW'],
          P2: raw['SAH_MTO_PQM1_ACTIVE_POWER_P2_KW'],
          P3: raw['SAH_MTO_PQM1_ACTIVE_POWER_P3_KW'],
          present: raw['SAH_MTO_PQM1_ACTIVE_POWER_TOTAL_KW'],
        },
        'Reactive (kVAR)': {
          Q1: raw['SAH_MTO_PQM1_REACTIVE_POWER_Q1_KVAR'],
          Q2: raw['SAH_MTO_PQM1_REACTIVE_POWER_Q2_KVAR'],
          Q3: raw['SAH_MTO_PQM1_REACTIVE_POWER_Q3_KVAR'],
          present: raw['SAH_MTO_PQM1_REACTIVE_POWER_TOTAL_KVAR'],
        },
        'Apparent (kVA)': {
          S1: raw['SAH_MTO_PQM1_APPARENT_POWER_S1_KVA'],
          S2: raw['SAH_MTO_PQM1_APPARENT_POWER_S2_KVA'],
          S3: raw['SAH_MTO_PQM1_APPARENT_POWER_S3_KVA'],
          present: raw['SAH_MTO_PQM1_APPARENT_POWER_TOTAL_KVA'],
        },
        'Power Factor Total': {
          present: raw['SAH_MTO_PQM1_POWER_FACTOR_TOTAL'],
          min: raw['SAH_MTO_PQM1_Min_POWER_FACTOR_TOTAL'],
          max: raw['SAH_MTO_PQM1_Max_POWER_FACTOR_TOTAL'],
        },
      },
      'Current Unbalance (%)': raw['SAH_MTO_PQM1_UNBALANCE_FACTOR_CURRENT'],
      'Voltage Unbalance (%)': raw['SAH_MTO_PQM1_UNBALANCE_FACTOR_VOLTAGE'],
      maxVoltageLN: {
        L1: raw['SAH_MTO_PQM1_Max_VOLTAGE_LINE_1_V'],
        L2: raw['SAH_MTO_PQM1_Max_VOLTAGE_LINE_2_V'],
        L3: raw['SAH_MTO_PQM1_Max_VOLTAGE_LINE_3_V'],
      },
      maxVoltageLL: {
        L1_2: raw['SAH_MTO_PQM1_Max_VOLTAGE_LINE_1_2_V'],
        L2_3: raw['SAH_MTO_PQM1_Max_VOLTAGE_LINE_2_3_V'],
        L3_1: raw['SAH_MTO_PQM1_Max_VOLTAGE_LINE_3_1_V'],
      },
      minVoltageLN: {
        L1: raw['SAH_MTO_PQM1_Min_VOLTAGE_LINE_1_V'],
        L2: raw['SAH_MTO_PQM1_Min_VOLTAGE_LINE_2_V'],
        L3: raw['SAH_MTO_PQM1_Min_VOLTAGE_LINE_3_V'],
      },
      minVoltageLL: {
        L1_2: raw['SAH_MTO_PQM1_Min_VOLTAGE_LINE_1_2_V'],
        L2_3: raw['SAH_MTO_PQM1_Min_VOLTAGE_LINE_2_3_V'],
        L3_1: raw['SAH_MTO_PQM1_Min_VOLTAGE_LINE_3_1_V'],
      },
      maxCurrent: {
        I1: raw['SAH_MTO_PQM1_Max_CURRENT_LINE_1_A'],
        I2: raw['SAH_MTO_PQM1_Max_CURRENT_LINE_2_A'],
        I3: raw['SAH_MTO_PQM1_Max_CURRENT_LINE_3_A'],
      },
      minCurrent: {
        I1: raw['SAH_MTO_PQM1_Min_CURRENT_LINE_1_A'],
        I2: raw['SAH_MTO_PQM1_Min_CURRENT_LINE_2_A'],
        I3: raw['SAH_MTO_PQM1_Min_CURRENT_LINE_3_A'],
      },
      maxPowerTotal: {
        'Active (kW)': raw['SAH_MTO_PQM1_Max_ACTIVE_POWER_TOTAL_KW'],
        'Reactive (kVAR)': raw['SAH_MTO_PQM1_Max_REACTIVE_POWER_TOTAL_KVAR'],
        'Apparent (kVA)': raw['SAH_MTO_PQM1_Max_APPARENT_POWER_TOTAL_KVA'],
      },
      minPowerTotal: {
        'Active (kW)': raw['SAH_MTO_PQM1_Min_ACTIVE_POWER_TOTAL_KW'],
        'Reactive (kVAR)': raw['SAH_MTO_PQM1_Min_REACTIVE_POWER_TOTAL_KVAR'],
        'Apparent (kVA)': raw['SAH_MTO_PQM1_Min_APPARENT_POWER_TOTAL_KVA'],
      },
    };

    return { structured, raw };
  }

  // Calculate averages
  private calculateAverages(structured: any) {
    const parseNumber = (val: any): number | null => {
      if (val === null || val === undefined) return null;
      const n = parseFloat(String(val).trim());
      return isNaN(n) ? null : n;
    };

    const avg = (vals: any[]): number | null => {
      const nums = vals.map(parseNumber).filter((v) => v !== null);
      if (!nums.length) return null;
      return nums.reduce((a, b) => a + b, 0) / nums.length;
    };

    return {
      'I Average (A)': avg([
        structured.current['I a (A)'],
        structured.current['I b (A)'],
        structured.current['I c (A)'],
      ]),
      'Voltage L-N Average (V)': avg([
        structured.voltageLN['Vln a (V)'],
        structured.voltageLN['Vln b (V)'],
        structured.voltageLN['Vln c (V)'],
      ]),
      'Voltage L-L Average (V)': avg([
        structured.voltageLL['Vll ab (V)'],
        structured.voltageLL['Vll bc (V)'],
        structured.voltageLL['Vll ca (V)'],
      ]),
      maxVoltageLN: avg([
        structured.maxVoltageLN.L1,
        structured.maxVoltageLN.L2,
        structured.maxVoltageLN.L3,
      ]),
      maxVoltageLL: avg([
        structured.maxVoltageLL.L1_2,
        structured.maxVoltageLL.L2_3,
        structured.maxVoltageLL.L3_1,
      ]),
      minVoltageLN: avg([
        structured.minVoltageLN.L1,
        structured.minVoltageLN.L2,
        structured.minVoltageLN.L3,
      ]),
      minVoltageLL: avg([
        structured.minVoltageLL.L1_2,
        structured.minVoltageLL.L2_3,
        structured.minVoltageLL.L3_1,
      ]),
      maxCurrent: avg([
        structured.maxCurrent.I1,
        structured.maxCurrent.I2,
        structured.maxCurrent.I3,
      ]),
      minCurrent: avg([
        structured.minCurrent.I1,
        structured.minCurrent.I2,
        structured.minCurrent.I3,
      ]),
    };
  }

  async updateSnapshot(): Promise<void> {
    const newData = await this.fetchNodeRedData();
    if (!newData) return;

    const cleanedData = this.cleanData(newData);
    const { structured, raw } = this.transformData(cleanedData);
    const averages = this.calculateAverages(structured);

    if (raw && raw._id) delete raw._id;

    await this.snapshotModel.findOneAndUpdate(
      {},
      { meterData: { structured, averages, raw } },
      { upsert: true, new: true },
    );

    this.logger.log('Snapshot updated (structured + averages + raw)');
  }

  async getSnapshot(): Promise<any> {
    const snapshot = await this.snapshotModel
      .findOne({}, { _id: 0, __v: 0 })
      .lean();

    return snapshot?.meterData || {};
  }
}
