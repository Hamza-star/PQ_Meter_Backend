/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
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

  async fetchNodeRedData(): Promise<any> {
    try {
      const response = await axios.get('http://127.0.0.1:1880/realtimelink');
      return response.data.Meter_Data;
    } catch (err) {
      this.logger.error('Failed to fetch Node-RED data', err);
      return null;
    }
  }

  private cleanData(data: any): any {
    if (!data || typeof data !== 'object') return data;
    const cleaned: any = Array.isArray(data) ? [] : {};
    for (const key of Object.keys(data)) {
      if (key.toLowerCase().includes('timestamp')) continue;
      cleaned[key] = this.cleanData(data[key]);
    }
    return cleaned;
  }

  private updateDemandField(
    prev: { value: string | null; timestamp: string | null } | undefined,
    newValue: string | null,
  ): { value: string | null; timestamp: string | null } {
    if (newValue === null || newValue === undefined)
      return prev || { value: null, timestamp: null };

    const prevNum =
      prev?.value !== null && prev?.value !== undefined
        ? Number(prev.value)
        : null;
    const newNum = Number(newValue);

    if (prevNum !== newNum) {
      return { value: newValue, timestamp: new Date().toISOString() };
    }

    return prev!;
  }

  private transformData(raw: any, prevStructured: any = null) {
    const structured: any = {
      voltageLN: {
        'Vln a (V)': raw['SAH_MTO_PQM1_VOLTAGE_LINE_1_V'],
        'Vln b (V)': raw['SAH_MTO_PQM1_VOLTAGE_LINE_2_V'],
        'Vln c (V)': raw['SAH_MTO_PQM1_VOLTAGE_LINE_3_V'],
      },
      voltageLL: {
        'Vll ab (V)': raw['SAH_MTO_PQM1_VOLTAGE_LINE_1_2_V'],
        'Vll bc (V)': raw['SAH_MTO_PQM1_VOLTAGE_LINE_2_3_V'],
        'Vll ca (V)': raw['SAH_MTO_PQM1_VOLTAGE_LINE_3_1_V'],
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
        'Power Factor Total': raw['SAH_MTO_PQM1_POWER_FACTOR_TOTAL'],
      },
      'Current Unbalance (%)': raw['SAH_MTO_PQM1_UNBALANCE_FACTOR_CURRENT'],
      'Voltage Unbalance (%)': raw['SAH_MTO_PQM1_UNBALANCE_FACTOR_VOLTAGE'],

      voltageTHD: {
        'V1 THD 3s (%)': raw['SAH_MTO_PQM1_Int_HARMONICS_V1_THD_1'] ?? null,
        'V2 THD 3s (%)': raw['SAH_MTO_PQM1_Int_HARMONICS_V2_THD_1'] ?? null,
        'V3 THD 3s (%)': raw['SAH_MTO_PQM1_Int_HARMONICS_V3_THD_1'] ?? null,
      },
      currentTHD: {
        'I1 THD 3s (%)': raw['SAH_MTO_PQM1_Int_HARMONICS_I1_THD_1'] ?? null,
        'I2 THD 3s (%)': raw['SAH_MTO_PQM1_Int_HARMONICS_I2_THD_1'] ?? null,
        'I3 THD 3s (%)': raw['SAH_MTO_PQM1_Int_HARMONICS_I3_THD_1'] ?? null,
      },

      kFactor: {
        'I1 K Factor': raw['SAH_MTO_PQM1_KFactor_CURRENT_1'] ?? null,
        'I2 K Factor': raw['SAH_MTO_PQM1_KFactor_CURRENT_2'] ?? null,
        'I3 K Factor': raw['SAH_MTO_PQM1_KFactor_CURRENT_3'] ?? null,
      },
      crestFactor: {
        'I1 Crest Factor': raw['SAH_MTO_PQM1_CrestFactor_VOLTAGE_1'] ?? null,
        'I2 Crest Factor': raw['SAH_MTO_PQM1_CrestFactor_VOLTAGE_2'] ?? null,
        'I3 Crest Factor': raw['SAH_MTO_PQM1_CrestFactor_VOLTAGE_3'] ?? null,
      },

      maxVoltageLN: {
        'Vln a (V)': raw['SAH_MTO_PQM1_Max_VOLTAGE_LINE_1_V'],
        'Vln b (V)': raw['SAH_MTO_PQM1_Max_VOLTAGE_LINE_2_V'],
        'Vln c (V)': raw['SAH_MTO_PQM1_Max_VOLTAGE_LINE_3_V'],
      },
      maxVoltageLL: {
        'Vll ab (V)': raw['SAH_MTO_PQM1_Max_VOLTAGE_LINE_1_2_V'],
        'Vll bc (V)': raw['SAH_MTO_PQM1_Max_VOLTAGE_LINE_2_3_V'],
        'Vll ca (V)': raw['SAH_MTO_PQM1_Max_VOLTAGE_LINE_3_1_V'],
      },
      minVoltageLN: {
        'Vln a (V)': raw['SAH_MTO_PQM1_Min_VOLTAGE_LINE_1_V'],
        'Vln b (V)': raw['SAH_MTO_PQM1_Min_VOLTAGE_LINE_2_V'],
        'Vln c (V)': raw['SAH_MTO_PQM1_Min_VOLTAGE_LINE_3_V'],
      },
      minVoltageLL: {
        'Vll ab (V)': raw['SAH_MTO_PQM1_Min_VOLTAGE_LINE_1_2_V'],
        'Vll bc (V)': raw['SAH_MTO_PQM1_Min_VOLTAGE_LINE_2_3_V'],
        'Vll ca (V)': raw['SAH_MTO_PQM1_Min_VOLTAGE_LINE_3_1_V'],
      },
      maxCurrent: {
        'I a (A)': raw['SAH_MTO_PQM1_Max_CURRENT_LINE_1_A'],
        'I b (A)': raw['SAH_MTO_PQM1_Max_CURRENT_LINE_2_A'],
        'I c (A)': raw['SAH_MTO_PQM1_Max_CURRENT_LINE_3_A'],
      },
      minCurrent: {
        'I a (A)': raw['SAH_MTO_PQM1_Min_CURRENT_LINE_1_A'],
        'I b (A)': raw['SAH_MTO_PQM1_Min_CURRENT_LINE_2_A'],
        'I c (A)': raw['SAH_MTO_PQM1_Min_CURRENT_LINE_3_A'],
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

      demandInterval: {
        'Ia (A)': raw['SAH_MTO_PQM1_PreviousDemand_CURRENT_LINE_1_A'] ?? null,
        'Ib (A)': raw['SAH_MTO_PQM1_PreviousDemand_CURRENT_LINE_2_A'] ?? null,
        'Ic (A)': raw['SAH_MTO_PQM1_PreviousDemand_CURRENT_LINE_3_A'] ?? null,
      },

      // Max Demand with timestamp only if value changes
      maxDemand: {
        current: {
          'Ia (A)': this.updateDemandField(
            prevStructured?.maxDemand?.current?.['Ia (A)'],
            raw['SAH_MTO_PQM1_MaxDemand_CURRENT_LINE_1_A'] ?? null,
          ),
          'Ib (A)': this.updateDemandField(
            prevStructured?.maxDemand?.current?.['Ib (A)'],
            raw['SAH_MTO_PQM1_MaxDemand_CURRENT_LINE_2_A'] ?? null,
          ),
          'Ic (A)': this.updateDemandField(
            prevStructured?.maxDemand?.current?.['Ic (A)'],
            raw['SAH_MTO_PQM1_MaxDemand_CURRENT_LINE_3_A'] ?? null,
          ),
        },
        power: {
          'Active (kW)': this.updateDemandField(
            prevStructured?.maxDemand?.power?.['Active (kW)'],
            raw['SAH_MTO_PQM1_MaxDemand_ACTIVE_POWER_KW'] ?? null,
          ),
          'Reactive (kVAR)': this.updateDemandField(
            prevStructured?.maxDemand?.power?.['Reactive (kVAR)'],
            raw['SAH_MTO_PQM1_MaxDemand_REACTIVE_POWER_KVAR'] ?? null,
          ),
          'Apparent (kVA)': this.updateDemandField(
            prevStructured?.maxDemand?.power?.['Apparent (kVA)'],
            raw['SAH_MTO_PQM1_MaxDemand_APPARENT_POWER_KVA'] ?? null,
          ),
        },
      },
    };

    return { structured, raw };
  }

  private calculateAverages(structured: any) {
    const avg = (vals: any[]) => {
      const nums = vals.map((v) => Number(v)).filter((v) => !isNaN(v));
      return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
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
        structured.maxVoltageLN['Vln a (V)'],
        structured.maxVoltageLN['Vln b (V)'],
        structured.maxVoltageLN['Vln c (V)'],
      ]),
      maxVoltageLL: avg([
        structured.maxVoltageLL['Vll ab (V)'],
        structured.maxVoltageLL['Vll bc (V)'],
        structured.maxVoltageLL['Vll ca (V)'],
      ]),
      minVoltageLN: avg([
        structured.minVoltageLN['Vln a (V)'],
        structured.minVoltageLN['Vln b (V)'],
        structured.minVoltageLN['Vln c (V)'],
      ]),
      minVoltageLL: avg([
        structured.minVoltageLL['Vll ab (V)'],
        structured.minVoltageLL['Vll bc (V)'],
        structured.minVoltageLL['Vll ca (V)'],
      ]),
      maxCurrent: avg([
        structured.maxCurrent['I a (A)'],
        structured.maxCurrent['I b (A)'],
        structured.maxCurrent['I c (A)'],
      ]),
      minCurrent: avg([
        structured.minCurrent['I a (A)'],
        structured.minCurrent['I b (A)'],
        structured.minCurrent['I c (A)'],
      ]),
    };
  }

  async updateSnapshot(): Promise<void> {
    const newData = await this.fetchNodeRedData();
    if (!newData) return;

    const cleanedData = this.cleanData(newData);
    const prev = await this.snapshotModel.findOne().lean();
    const prevStructured = prev?.meterData?.structured || null;

    const { structured, raw } = this.transformData(cleanedData, prevStructured);
    const averages = this.calculateAverages(structured);

    if (raw && raw._id) delete raw._id;

    await this.snapshotModel.findOneAndUpdate(
      {},
      { meterData: { structured, averages, raw } },
      { upsert: true, new: true },
    );

    this.logger.log('Snapshot updated with all fields + demand timestamps');
  }

  async getSnapshot(): Promise<any> {
    const snapshot = await this.snapshotModel
      .findOne({}, { _id: 0, __v: 0 })
      .lean();

    return snapshot?.meterData || {};
  }
}

// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// import { Injectable, Logger } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import axios from 'axios';
// import { Snapshot, SnapshotDocument } from './schema/snapshot.schema';

// @Injectable()
// export class MeterService {
//   private readonly logger = new Logger(MeterService.name);

//   constructor(
//     @InjectModel(Snapshot.name) private snapshotModel: Model<SnapshotDocument>,
//   ) {}

//   // Node-RED se data fetch
//   async fetchNodeRedData(): Promise<any> {
//     try {
//       const response = await axios.get('http://127.0.0.1:1880/realtimelink');
//       return response.data.Meter_Data;
//     } catch (err) {
//       this.logger.error('Failed to fetch Node-RED data', err);
//       return null;
//     }
//   }

//   // Data cleanup
//   private cleanData(data: any): any {
//     if (!data || typeof data !== 'object') return data;
//     const cleaned: any = Array.isArray(data) ? [] : {};
//     for (const key of Object.keys(data)) {
//       cleaned[key] = this.cleanData(data[key]);
//     }
//     return cleaned;
//   }

//   // Update max demand with Node-RED timestamp
//   private updateDemandField(
//     prev:
//       | { value: string | number | null; timestamp: string | null }
//       | undefined,
//     newValue: string | number | null,
//     nodeRedTimestamp: any,
//   ): { value: number | null; timestamp: string } {
//     const valueNum =
//       newValue !== null && newValue !== undefined ? Number(newValue) : null;

//     // Always return object with value + timestamp
//     const timestamp = new Date().toISOString();

//     if (!prev) {
//       return { value: valueNum, timestamp };
//     }

//     const prevNum =
//       prev.value !== null && prev.value !== undefined
//         ? Number(prev.value)
//         : null;

//     if (prevNum !== valueNum) {
//       return { value: valueNum, timestamp };
//     }

//     // If value unchanged, keep previous timestamp
//     return { value: valueNum, timestamp: prev.timestamp || timestamp };
//   }

//   // Transform raw data
//   private transformData(raw: any, prevStructured: any = null) {
//     const timestamp = raw['SAH_MTO_PQM1_timestamp'] ?? null;

//     const structured: any = {
//       voltageLN: {
//         'Vln a (V)': Number(raw['SAH_MTO_PQM1_VOLTAGE_LINE_1_V']),
//         'Vln b (V)': Number(raw['SAH_MTO_PQM1_VOLTAGE_LINE_2_V']),
//         'Vln c (V)': Number(raw['SAH_MTO_PQM1_VOLTAGE_LINE_3_V']),
//       },
//       voltageLL: {
//         'Vll ab (V)': Number(raw['SAH_MTO_PQM1_VOLTAGE_LINE_1_2_V']),
//         'Vll bc (V)': Number(raw['SAH_MTO_PQM1_VOLTAGE_LINE_2_3_V']),
//         'Vll ca (V)': Number(raw['SAH_MTO_PQM1_VOLTAGE_LINE_3_1_V']),
//       },
//       current: {
//         'Ia (A)': Number(raw['SAH_MTO_PQM1_CURRENT_LINE_1_A']),
//         'Ib (A)': Number(raw['SAH_MTO_PQM1_CURRENT_LINE_2_A']),
//         'Ic (A)': Number(raw['SAH_MTO_PQM1_CURRENT_LINE_3_A']),
//       },
//       power: {
//         'Active (kW)': {
//           P1: Number(raw['SAH_MTO_PQM1_ACTIVE_POWER_P1_KW']),
//           P2: Number(raw['SAH_MTO_PQM1_ACTIVE_POWER_P2_KW']),
//           P3: Number(raw['SAH_MTO_PQM1_ACTIVE_POWER_P3_KW']),
//           present: Number(raw['SAH_MTO_PQM1_ACTIVE_POWER_TOTAL_KW']),
//         },
//         'Reactive (kVAR)': {
//           Q1: Number(raw['SAH_MTO_PQM1_REACTIVE_POWER_Q1_KVAR']),
//           Q2: Number(raw['SAH_MTO_PQM1_REACTIVE_POWER_Q2_KVAR']),
//           Q3: Number(raw['SAH_MTO_PQM1_REACTIVE_POWER_Q3_KVAR']),
//           present: Number(raw['SAH_MTO_PQM1_REACTIVE_POWER_TOTAL_KVAR']),
//         },
//         'Apparent (kVA)': {
//           S1: Number(raw['SAH_MTO_PQM1_APPARENT_POWER_S1_KVA']),
//           S2: Number(raw['SAH_MTO_PQM1_APPARENT_POWER_S2_KVA']),
//           S3: Number(raw['SAH_MTO_PQM1_APPARENT_POWER_S3_KVA']),
//           present: Number(raw['SAH_MTO_PQM1_APPARENT_POWER_TOTAL_KVA']),
//         },
//         'Power Factor Total': Number(raw['SAH_MTO_PQM1_POWER_FACTOR_TOTAL']),
//       },
//       'Current Unbalance (%)': Number(
//         raw['SAH_MTO_PQM1_UNBALANCE_FACTOR_CURRENT'],
//       ),
//       'Voltage Unbalance (%)': Number(
//         raw['SAH_MTO_PQM1_UNBALANCE_FACTOR_VOLTAGE'],
//       ),
//       maxDemand: {
//         current: {
//           'Ia (A)': this.updateDemandField(
//             prevStructured?.maxDemand?.current?.['Ia (A)'],
//             raw['SAH_MTO_PQM1_MaxDemand_CURRENT_LINE_1_A'],
//             timestamp,
//           ),
//           'Ib (A)': this.updateDemandField(
//             prevStructured?.maxDemand?.current?.['Ib (A)'],
//             raw['SAH_MTO_PQM1_MaxDemand_CURRENT_LINE_2_A'],
//             timestamp,
//           ),
//           'Ic (A)': this.updateDemandField(
//             prevStructured?.maxDemand?.current?.['Ic (A)'],
//             raw['SAH_MTO_PQM1_MaxDemand_CURRENT_LINE_3_A'],
//             timestamp,
//           ),
//         },
//         power: {
//           'Active (kW)': this.updateDemandField(
//             prevStructured?.maxDemand?.power?.['Active (kW)'],
//             raw['SAH_MTO_PQM1_MaxDemand_ACTIVE_POWER_KW'],
//             timestamp,
//           ),
//           'Reactive (kVAR)': this.updateDemandField(
//             prevStructured?.maxDemand?.power?.['Reactive (kVAR)'],
//             raw['SAH_MTO_PQM1_MaxDemand_REACTIVE_POWER_KVAR'],
//             timestamp,
//           ),
//           'Apparent (kVA)': this.updateDemandField(
//             prevStructured?.maxDemand?.power?.['Apparent (kVA)'],
//             raw['SAH_MTO_PQM1_MaxDemand_APPARENT_POWER_KVA'],
//             timestamp,
//           ),
//         },
//       },
//     };

//     return { structured, raw };
//   }

//   // Calculate averages
//   private calculateAverages(structured: any) {
//     const avg = (vals: number[]) => {
//       const nums = vals.filter((v) => !isNaN(v));
//       return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
//     };

//     return {
//       'I Average (A)': avg([
//         structured.current['Ia (A)'],
//         structured.current['Ib (A)'],
//         structured.current['Ic (A)'],
//       ]),
//       'Voltage L-N Average (V)': avg([
//         structured.voltageLN['Vln a (V)'],
//         structured.voltageLN['Vln b (V)'],
//         structured.voltageLN['Vln c (V)'],
//       ]),
//       'Voltage L-L Average (V)': avg([
//         structured.voltageLL['Vll ab (V)'],
//         structured.voltageLL['Vll bc (V)'],
//         structured.voltageLL['Vll ca (V)'],
//       ]),
//     };
//   }

//   // Update snapshot
//   async updateSnapshot(): Promise<void> {
//     const newData = await this.fetchNodeRedData();
//     if (!newData) return;

//     const cleanedData = this.cleanData(newData);
//     const prev = await this.snapshotModel.findOne().lean();
//     const prevStructured = prev?.meterData?.structured || null;

//     const { structured, raw } = this.transformData(cleanedData, prevStructured);
//     const averages = this.calculateAverages(structured);

//     await this.snapshotModel.updateOne(
//       {},
//       {
//         $set: {
//           'meterData.structured': structured,
//           'meterData.averages': averages,
//           'meterData.raw': raw,
//         },
//       },
//       { upsert: true },
//     );

//     this.logger.log('Snapshot updated with Node-RED timestamps and averages');
//   }

//   async getSnapshot(): Promise<any> {
//     const snapshot = await this.snapshotModel
//       .findOne({}, { _id: 0, __v: 0 })
//       .lean();
//     return snapshot?.meterData || {};
//   }
// }
