/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable no-constant-binary-expression */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class MeterService {
  private readonly logger = new Logger(MeterService.name);

  // In-memory previous structured data for timestamp checks
  private prevStructured: any = null;

  async fetchNodeRedData(): Promise<any> {
    try {
      const response = await axios.get('http://127.0.0.1:1880/realtimelink');
      return response.data;
    } catch (err) {
      this.logger.error('Failed to fetch Node-RED data', err);
      return null;
    }
  }

  // private updateDemandField(
  //   prev: { value: string | null; timestamp: string | null } | undefined,
  //   newValue: string | null,
  // ): { value: string | null; timestamp: string | null } {
  //   if (newValue === null || newValue === undefined)
  //     return prev || { value: null, timestamp: null };

  //   const prevNum =
  //     prev?.value !== null && prev?.value !== undefined
  //       ? Number(prev.value)
  //       : null;
  //   const newNum = Number(newValue);

  //   // Only update timestamp if value has changed
  //   if (prevNum === null || prevNum !== newNum) {
  //     return { value: newValue, timestamp: new Date().toISOString() };
  //   }

  //   return prev!;
  // }

  private updateDemandField(
    prev: { value: string | null; timestamp: string | null } | undefined,
    newValue: string | null,
  ): { value: string | null; timestamp: string | null } {
    if (newValue === null || newValue === undefined) {
      return prev || { value: null, timestamp: null };
    }

    // If previous value is same as new value, return prev (keep old timestamp)
    if (prev?.value === newValue) {
      return prev;
    }

    // Value has changed, update both value and timestamp
    return { value: newValue, timestamp: new Date().toISOString() };
  }

  private parseTHD(value: string | null): number | null {
    if (!value) return null;
    return Number(value.replace('%', '').trim());
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
        'Active (kW)': { present: raw['SAH_MTO_PQM1_ACTIVE_POWER_TOTAL_KW'] },
        'Reactive (kVAR)': {
          present: raw['SAH_MTO_PQM1_REACTIVE_POWER_TOTAL_KVAR'],
        },
        'Apparent (kVA)': {
          present: raw['SAH_MTO_PQM1_APPARENT_POWER_TOTAL_KVA'],
        },
        'Power Factor Total': raw['SAH_MTO_PQM1_POWER_FACTOR_TOTAL'],
      },
      'Current Unbalance (%)': raw['SAH_MTO_PQM1_UNBALANCE_FACTOR_CURRENT'],
      'Voltage Unbalance (%)': raw['SAH_MTO_PQM1_UNBALANCE_FACTOR_VOLTAGE'],

      voltageTHD: {
        'V1 THD (%)': this.parseTHD(raw['SAH_MTO_PQM1_Int THD-V1']),
        'V2 THD (%)': this.parseTHD(raw['SAH_MTO_PQM1_Int THD-V2']),
        'V3 THD (%)': this.parseTHD(raw['SAH_MTO_PQM1_Int THD-V3']),
      },
      currentTHD: {
        'I1 THD (%)': this.parseTHD(raw['SAH_MTO_PQM1_Int THD-I1']),
        'I2 THD (%)': this.parseTHD(raw['SAH_MTO_PQM1_Int THD-I2']),
        'I3 THD (%)': this.parseTHD(raw['SAH_MTO_PQM1_Int THD-I3']),
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

      // Existing max/min voltage and current
      maxVoltageLN: {
        'Vln a (V)': raw['SAH_MTO_PQM1_Max_VOLTAGE_LINE_1_V'],
        'Vln b (V)': raw['SAH_MTO_PQM1_Max_VOLTAGE_LINE_2_V'],
        'Vln c (V)': raw['SAH_MTO_PQM1_Max_VOLTAGE_LINE_3_V'],
      },
      minVoltageLN: {
        'Vln a (V)': raw['SAH_MTO_PQM1_Min_VOLTAGE_LINE_1_V'],
        'Vln b (V)': raw['SAH_MTO_PQM1_Min_VOLTAGE_LINE_2_V'],
        'Vln c (V)': raw['SAH_MTO_PQM1_Min_VOLTAGE_LINE_3_V'],
      },
      maxVoltageLL: {
        'Vll ab (V)': raw['SAH_MTO_PQM1_Max_VOLTAGE_LINE_1_2_V'],
        'Vll bc (V)': raw['SAH_MTO_PQM1_Max_VOLTAGE_LINE_2_3_V'],
        'Vll ca (V)': raw['SAH_MTO_PQM1_Max_VOLTAGE_LINE_3_1_V'],
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

      // Demand readings
      demandReadings: {
        current: {
          'Ia (A)': this.updateDemandField(
            prevStructured?.demandReadings?.current?.['Ia (A)'],
            raw['SAH_MTO_PQM1_MaxDemand_CURRENT_LINE_1_A'] ?? null,
          ),
          'Ib (A)': this.updateDemandField(
            prevStructured?.demandReadings?.current?.['Ib (A)'],
            raw['SAH_MTO_PQM1_MaxDemand_CURRENT_LINE_2_A'] ?? null,
          ),
          'Ic (A)': this.updateDemandField(
            prevStructured?.demandReadings?.current?.['Ic (A)'],
            raw['SAH_MTO_PQM1_MaxDemand_CURRENT_LINE_3_A'] ?? null,
          ),
        },
        power: {
          'Demand Power Active (kW)': this.updateDemandField(
            prevStructured?.demandReadings?.power?.['Demand Power Active (kW)'],
            raw['SAH_MTO_PQM1_MaxDemand_ACTIVE_POWER_KW'] ?? null,
          ),
          'Demand Power Reactive (kVAR)': this.updateDemandField(
            prevStructured?.demandReadings?.power?.[
              'Demand Power Reactive (kVAR)'
            ],
            raw['SAH_MTO_PQM1_MaxDemand_REACTIVE_POWER_KVAR'] ?? null,
          ),
          'Demand Apparent (kVA)': this.updateDemandField(
            prevStructured?.demandReadings?.power?.['Demand Apparent (kVA)'],
            raw['SAH_MTO_PQM1_MaxDemand_APPARENT_POWER_KVA'] ?? null,
          ),
        },
        currentLastInterval: {
          'Ia (A)': raw['SAH_MTO_PQM1_PreviousDemand_CURRENT_LINE_1_A'] ?? null,
          'Ib (A)': raw['SAH_MTO_PQM1_PreviousDemand_CURRENT_LINE_2_A'] ?? null,
          'Ic (A)': raw['SAH_MTO_PQM1_PreviousDemand_CURRENT_LINE_3_A'] ?? null,
        },
        powerLastInterval: {
          'Demand Power Active (kW)':
            raw['SAH_MTO_PQM1_PreviousDemand_ACTIVE_POWER_KW'] ?? null,
          'Demand Power Reactive (kVAR)':
            raw['SAH_MTO_PQM1_PreviousDemand_REACTIVE_POWER_KVAR'] ?? null,
          'Demand Power Apparent (kVA)':
            raw['SAH_MTO_PQM1_PreviousDemand_APPARENT_POWER_KVA'] ?? null,
        },
      },

      // Energy readings
      energyReadings: {
        present: {
          'Active (kWh)': raw['SAH_MTO_PQM1_ACTIVE_ENERGY_EXPORT_KWH'],
          'Reactive (kVARh)': raw['SAH_MTO_PQM1_REACTIVE_ENERGY_EXPORT_KVARH'],
          'Apparent (kVAh)': raw['SAH_MTO_PQM1_APPARENT_ENERGY_KVAH'],
        },
      },

      // THD max/min tracking
      maxVoltageTHD: {},
      minVoltageTHD: {},
      maxCurrentTHD: {},
      minCurrentTHD: {},
    };

    const updateTHD = (
      prevMax: number | null,
      prevMin: number | null,
      newVal: number | null,
    ) => {
      if (newVal === null || isNaN(newVal))
        return { max: prevMax, min: prevMin };
      return {
        max: prevMax !== null ? Math.max(prevMax, newVal) : newVal,
        min: prevMin !== null ? Math.min(prevMin, newVal) : newVal,
      };
    };

    // Voltage THD
    const voltageTHDKeys = ['V1 THD (%)', 'V2 THD (%)', 'V3 THD (%)'];
    voltageTHDKeys.forEach((key, idx) => {
      const prevMax = prevStructured?.maxVoltageTHD?.[key] ?? null;
      const prevMin = prevStructured?.minVoltageTHD?.[key] ?? null;
      const newVal = structured.voltageTHD[key];
      const { max, min } = updateTHD(prevMax, prevMin, newVal);
      structured.maxVoltageTHD[key] = max;
      structured.minVoltageTHD[key] = min;
    });

    // Current THD
    const currentTHDKeys = ['I1 THD (%)', 'I2 THD (%)', 'I3 THD (%)'];
    currentTHDKeys.forEach((key, idx) => {
      const prevMax = prevStructured?.maxCurrentTHD?.[key] ?? null;
      const prevMin = prevStructured?.minCurrentTHD?.[key] ?? null;
      const newVal = structured.currentTHD[key];
      const { max, min } = updateTHD(prevMax, prevMin, newVal);
      structured.maxCurrentTHD[key] = max;
      structured.minCurrentTHD[key] = min;
    });

    return { structured };
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
      'Voltage THD Average (%)': avg([
        structured.voltageTHD['V1 THD (%)'],
        structured.voltageTHD['V2 THD (%)'],
        structured.voltageTHD['V3 THD (%)'],
      ]),
      'Current THD Average (%)': avg([
        structured.currentTHD['I1 THD (%)'],
        structured.currentTHD['I2 THD (%)'],
        structured.currentTHD['I3 THD (%)'],
      ]),
    };
  }

  async getSnapshot(): Promise<any> {
    const rawData = await this.fetchNodeRedData();
    if (!rawData) return {};

    // Pass previous structured to correctly handle timestamps
    const { structured } = this.transformData(rawData, this.prevStructured);
    const averages = this.calculateAverages(structured);

    // Update previous structured for next call
    this.prevStructured = structured;

    return { structured, averages };
  }

  async getPhaseAnglesWithMagnitude(): Promise<any> {
    const rawData = await this.fetchNodeRedData();
    if (!rawData) return {};

    const voltage = {
      Va: {
        magnitude: rawData['SAH_MTO_PQM1_VOLTAGE_LINE_1_V'] ?? null,
        angle:
          Number(
            rawData['SAH_MTO_PQM1_PhaseAngle_VOLTAGE_1']?.replace('°', ''),
          ) ?? null,
      },
      Vb: {
        magnitude: rawData['SAH_MTO_PQM1_VOLTAGE_LINE_2_V'] ?? null,
        angle:
          Number(
            rawData['SAH_MTO_PQM1_PhaseAngle_VOLTAGE_2']?.replace('°', ''),
          ) ?? null,
      },
      Vc: {
        magnitude: rawData['SAH_MTO_PQM1_VOLTAGE_LINE_3_V'] ?? null,
        angle:
          Number(
            rawData['SAH_MTO_PQM1_PhaseAngle_VOLTAGE_3']?.replace('°', ''),
          ) ?? null,
      },
    };

    const current = {
      Ia: {
        magnitude: rawData['SAH_MTO_PQM1_CURRENT_LINE_1_A'] ?? null,
        angle:
          Number(
            rawData['SAH_MTO_PQM1_PhaseAngle_CURRENT_1']?.replace('°', ''),
          ) ?? null,
      },
      Ib: {
        magnitude: rawData['SAH_MTO_PQM1_CURRENT_LINE_2_A'] ?? null,
        angle:
          Number(
            rawData['SAH_MTO_PQM1_PhaseAngle_CURRENT_2']?.replace('°', ''),
          ) ?? null,
      },
      Ic: {
        magnitude: rawData['SAH_MTO_PQM1_CURRENT_LINE_3_A'] ?? null,
        angle:
          Number(
            rawData['SAH_MTO_PQM1_PhaseAngle_CURRENT_3']?.replace('°', ''),
          ) ?? null,
      },
    };

    return { voltage, current };
  }

  // --- New waveform function ---
  async getWaveforms(): Promise<any> {
    const rawData = await this.fetchNodeRedData();
    if (!rawData) return {};

    const waveforms = {
      voltage: {
        V1: rawData['SAH_MTO_PQM1_VOLTAGE_1'] ?? [],
        V2: rawData['SAH_MTO_PQM1_VOLTAGE_2'] ?? [],
        V3: rawData['SAH_MTO_PQM1_VOLTAGE_3'] ?? [],
      },
      current: {
        I1: rawData['SAH_MTO_PQM1_CURRENT_1'] ?? [],
        I2: rawData['SAH_MTO_PQM1_CURRENT_2'] ?? [],
        I3: rawData['SAH_MTO_PQM1_CURRENT_3'] ?? [],
      },
    };

    return waveforms;
  }
}
