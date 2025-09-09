/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

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

  // Fetch data from Node-RED
  async fetchNodeRedData(): Promise<any> {
    try {
      const response = await axios.get('http://127.0.0.1:1880/realtimelink');
      return response.data.Meter_Data;
    } catch (err) {
      this.logger.error('Failed to fetch Node-RED data', err);
      return null;
    }
  }

  // Clean noisy fields (timestamps, counters) recursively
  private cleanData(data: any): any {
    if (!data || typeof data !== 'object') return data;
    const cleaned: any = Array.isArray(data) ? [] : {};
    for (const key of Object.keys(data)) {
      if (key.toLowerCase().includes('timestamp')) continue;
      cleaned[key] = this.cleanData(data[key]);
    }
    return cleaned;
  }

  // Transform raw tags → structured format
  private transformData(raw: any) {
    const structured = {
      voltageLN: {
        L1: raw['SAH_MTO_PQM1_VOLTAGE_LINE_1_V'],
        L2: raw['SAH_MTO_PQM1_VOLTAGE_LINE_2_V'],
        L3: raw['SAH_MTO_PQM1_VOLTAGE_LINE_3_V'],
      },
      voltageLL: {
        L1_2: raw['SAH_MTO_PQM1_VOLTAGE_LINE_1_2_V'],
        L2_3: raw['SAH_MTO_PQM1_VOLTAGE_LINE_2_3_V'],
        L3_1: raw['SAH_MTO_PQM1_VOLTAGE_LINE_3_1_V'],
      },
      current: {
        I1: raw['SAH_MTO_PQM1_CURRENT_LINE_1_A'],
        I2: raw['SAH_MTO_PQM1_CURRENT_LINE_2_A'],
        I3: raw['SAH_MTO_PQM1_CURRENT_LINE_3_A'],
      },
      power: {
        active: {
          P1: raw['SAH_MTO_PQM1_ACTIVE_POWER_P1_KW'],
          P2: raw['SAH_MTO_PQM1_ACTIVE_POWER_P2_KW'],
          P3: raw['SAH_MTO_PQM1_ACTIVE_POWER_P3_KW'],
          total: raw['SAH_MTO_PQM1_ACTIVE_POWER_TOTAL_KW'],
        },
        reactive: {
          Q1: raw['SAH_MTO_PQM1_REACTIVE_POWER_Q1_KVAR'],
          Q2: raw['SAH_MTO_PQM1_REACTIVE_POWER_Q2_KVAR'],
          Q3: raw['SAH_MTO_PQM1_REACTIVE_POWER_Q3_KVAR'],
          total: raw['SAH_MTO_PQM1_REACTIVE_POWER_TOTAL_KVAR'],
        },
        apparent: {
          S1: raw['SAH_MTO_PQM1_APPARENT_POWER_S1_KVA'],
          S2: raw['SAH_MTO_PQM1_APPARENT_POWER_S2_KVA'],
          S3: raw['SAH_MTO_PQM1_APPARENT_POWER_S3_KVA'],
          total: raw['SAH_MTO_PQM1_APPARENT_POWER_TOTAL_KVA'],
        },
        powerFactor: {
          total: raw['SAH_MTO_PQM1_POWER_FACTOR_TOTAL'],
          min: raw['SAH_MTO_PQM1_Min_POWER_FACTOR_TOTAL'],
          max: raw['SAH_MTO_PQM1_Max_POWER_FACTOR_TOTAL'],
        },
      },
      unbalance: {
        voltage: raw['SAH_MTO_PQM1_UNBALANCE_FACTOR_VOLTAGE'],
        current: raw['SAH_MTO_PQM1_UNBALANCE_FACTOR_CURRENT'],
      },
      phaseAngle: {
        voltage: {
          V1: raw['SAH_MTO_PQM1_PhaseAngle_VOLTAGE_1'],
          V2: raw['SAH_MTO_PQM1_PhaseAngle_VOLTAGE_2'],
          V3: raw['SAH_MTO_PQM1_PhaseAngle_VOLTAGE_3'],
        },
        current: {
          I1: raw['SAH_MTO_PQM1_PhaseAngle_CURRENT_1'],
          I2: raw['SAH_MTO_PQM1_PhaseAngle_CURRENT_2'],
          I3: raw['SAH_MTO_PQM1_PhaseAngle_CURRENT_3'],
        },
      },
      crestFactor: {
        voltage: {
          V1: raw['SAH_MTO_PQM1_CrestFactor_VOLTAGE_1'],
          V2: raw['SAH_MTO_PQM1_CrestFactor_VOLTAGE_2'],
          V3: raw['SAH_MTO_PQM1_CrestFactor_VOLTAGE_3'],
        },
      },
      kFactor: {
        current: {
          I1: raw['SAH_MTO_PQM1_KFactor_CURRENT_1'],
          I2: raw['SAH_MTO_PQM1_KFactor_CURRENT_2'],
          I3: raw['SAH_MTO_PQM1_KFactor_CURRENT_3'],
        },
      },
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
      maxCurrent: {
        I1: raw['SAH_MTO_PQM1_Max_CURRENT_LINE_1_A'],
        I2: raw['SAH_MTO_PQM1_Max_CURRENT_LINE_2_A'],
        I3: raw['SAH_MTO_PQM1_Max_CURRENT_LINE_3_A'],
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
      minCurrent: {
        I1: raw['SAH_MTO_PQM1_Min_CURRENT_LINE_1_A'],
        I2: raw['SAH_MTO_PQM1_Min_CURRENT_LINE_2_A'],
        I3: raw['SAH_MTO_PQM1_Min_CURRENT_LINE_3_A'],
      },
      maxPowerTotal: {
        active: raw['SAH_MTO_PQM1_Max_ACTIVE_POWER_TOTAL_KW'],
        reactive: raw['SAH_MTO_PQM1_Max_REACTIVE_POWER_TOTAL_KVAR'],
        apparent: raw['SAH_MTO_PQM1_Max_APPARENT_POWER_TOTAL_KVA'],
      },
      minPowerTotal: {
        active: raw['SAH_MTO_PQM1_Min_ACTIVE_POWER_TOTAL_KW'],
        reactive: raw['SAH_MTO_PQM1_Min_REACTIVE_POWER_TOTAL_KVAR'],
        apparent: raw['SAH_MTO_PQM1_Min_APPARENT_POWER_TOTAL_KVA'],
      },
    };

    return { structured, raw };
  }

  // Calculate averages
  private calculateAverages(structured: any) {
    const avg = (vals: any[]) => {
      const nums = vals.map((v) => parseFloat(v)).filter((v) => !isNaN(v));
      return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
    };

    return {
      voltageLN: avg([
        structured.voltageLN.L1,
        structured.voltageLN.L2,
        structured.voltageLN.L3,
      ]),
      voltageLL: avg([
        structured.voltageLL.L1_2,
        structured.voltageLL.L2_3,
        structured.voltageLL.L3_1,
      ]),
      current: avg([
        structured.current.I1,
        structured.current.I2,
        structured.current.I3,
      ]),
      power: {
        active: avg([
          structured.power.active.P1,
          structured.power.active.P2,
          structured.power.active.P3,
        ]),
        reactive: avg([
          structured.power.reactive.Q1,
          structured.power.reactive.Q2,
          structured.power.reactive.Q3,
        ]),
        apparent: avg([
          structured.power.apparent.S1,
          structured.power.apparent.S2,
          structured.power.apparent.S3,
        ]),
      },
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
      maxCurrent: avg([
        structured.maxCurrent.I1,
        structured.maxCurrent.I2,
        structured.maxCurrent.I3,
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
      minCurrent: avg([
        structured.minCurrent.I1,
        structured.minCurrent.I2,
        structured.minCurrent.I3,
      ]),
    };
  }

  // Update snapshot atomically
  async updateSnapshot(): Promise<void> {
    const newData = await this.fetchNodeRedData();
    if (!newData) return;

    const cleanedData = this.cleanData(newData);
    const { structured, raw } = this.transformData(cleanedData);
    const averages = this.calculateAverages(structured);

    // ⚡ remove mongo id from raw if present
    if (raw && raw._id) {
      delete raw._id;
    }

    await this.snapshotModel.findOneAndUpdate(
      {},
      { meterData: { structured, averages, raw } },
      { upsert: true, new: true },
    );

    this.logger.log('Snapshot updated (meterData wrapper + raw included)');
  }

  async getSnapshot(): Promise<any> {
    const snapshot = await this.snapshotModel
      .findOne({}, { _id: 0, __v: 0 })
      .lean();

    return snapshot?.meterData || {};
  }
}
