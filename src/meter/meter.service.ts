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

    // Only update timestamp if value has changed
    if (prevNum === null || prevNum !== newNum) {
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
          present: raw['SAH_MTO_PQM1_ACTIVE_POWER_TOTAL_KW'],
        },
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

      energyReadings: {
        present: {
          'Active (kWh)': raw['SAH_MTO_PQM1_ACTIVE_ENERGY_EXPORT_KWH'],
          'Reactive (kVARh)': raw['SAH_MTO_PQM1_REACTIVE_ENERGY_EXPORT_KVARH'],
          'Apparent (kVAh)': raw['SAH_MTO_PQM1_APPARENT_ENERGY_KVAH'],
        },
      },
    };

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
}
