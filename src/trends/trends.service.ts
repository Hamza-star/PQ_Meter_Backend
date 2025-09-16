/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { MongoClient, Db, Collection } from 'mongodb';

@Injectable()
export class TrendsService implements OnModuleInit, OnModuleDestroy {
  private client: MongoClient;
  private db: Db;
  private pqCollection: Collection;

  async onModuleInit() {
    this.client = new MongoClient(
      'mongodb+srv://alihamza:1uEiKEgyCfNg57qb@cluster0.rtxdhjc.mongodb.net/PQ_Meter?retryWrites=true&w=majority&appName=Cluster0',
    );
    await this.client.connect();
    this.db = this.client.db('PQ_Meter');
    this.pqCollection = this.db.collection('sample-data');
  }

  async onModuleDestroy() {
    await this.client.close();
  }

  private async fetchData(start: Date, end: Date) {
    return this.pqCollection
      .find({
        timestamp: { $gte: start.toISOString(), $lte: end.toISOString() },
      })
      .sort({ timestamp: 1 })
      .toArray();
  }

  private calculateStats(values: number[]) {
    if (!values.length) return { min: null, max: null, avg: null };
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return { min, max, avg };
  }

  private getFields(parameter: 'Voltage' | 'Current' | 'Power') {
    if (parameter === 'Voltage') {
      return [
        'SAH_MTO_PQM1_VOLTAGE_LINE_1_V',
        'SAH_MTO_PQM1_VOLTAGE_LINE_2_V',
        'SAH_MTO_PQM1_VOLTAGE_LINE_3_V',
        'SAH_MTO_PQM1_VOLTAGE_LINE_1_2_V',
        'SAH_MTO_PQM1_VOLTAGE_LINE_2_3_V',
        'SAH_MTO_PQM1_VOLTAGE_LINE_3_1_V',
      ];
    } else if (parameter === 'Current') {
      return [
        'SAH_MTO_PQM1_CURRENT_LINE_1_A',
        'SAH_MTO_PQM1_CURRENT_LINE_2_A',
        'SAH_MTO_PQM1_CURRENT_LINE_3_A',
      ];
    } else if (parameter === 'Power') {
      return [
        'SAH_MTO_PQM1_ACTIVE_POWER_P1_KW',
        'SAH_MTO_PQM1_ACTIVE_POWER_P2_KW',
        'SAH_MTO_PQM1_ACTIVE_POWER_P3_KW',
        'SAH_MTO_PQM1_REACTIVE_POWER_Q1_KVAR',
        'SAH_MTO_PQM1_REACTIVE_POWER_Q2_KVAR',
        'SAH_MTO_PQM1_REACTIVE_POWER_Q3_KVAR',
        'SAH_MTO_PQM1_APPARENT_POWER_S1_KVA',
        'SAH_MTO_PQM1_APPARENT_POWER_S2_KVA',
        'SAH_MTO_PQM1_APPARENT_POWER_S3_KVA',
      ];
    }
    return [];
  }

  private aggregateHourly(data: any[], parameter: string) {
    const hourlyData: Record<string, number[]> = {};
    const fields = this.getFields(parameter as 'Voltage' | 'Current' | 'Power');

    data.forEach((doc) => {
      const ts = new Date(doc.timestamp);
      const key = `${ts.getUTCFullYear()}-${ts.getUTCMonth() + 1}-${ts.getUTCDate()} ${ts.getUTCHours()}:00`;
      if (!hourlyData[key]) hourlyData[key] = [];
      hourlyData[key].push(...fields.map((f) => +doc[f]));
    });

    return Object.entries(hourlyData)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([interval, values]) => ({
        interval,
        parameter,
        ...this.calculateStats(values),
      }));
  }

  private aggregateDaily(data: any[], parameter: string) {
    const dailyData: Record<string, number[]> = {};
    const fields = this.getFields(parameter as 'Voltage' | 'Current' | 'Power');

    data.forEach((doc) => {
      const ts = new Date(doc.timestamp);
      const key = `${ts.getUTCFullYear()}-${ts.getUTCMonth() + 1}-${ts.getUTCDate()}`;
      if (!dailyData[key]) dailyData[key] = [];
      dailyData[key].push(...fields.map((f) => +doc[f]));
    });

    return Object.entries(dailyData)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([interval, values]) => ({
        interval,
        parameter,
        ...this.calculateStats(values),
      }));
  }

  async getTrend(parameter: 'Voltage' | 'Current' | 'Power', interval: string) {
    const now = new Date();
    let start: Date, end: Date;
    let useHourly = false;

    switch (interval) {
      case 'today':
        start = new Date(
          Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            0,
            0,
            0,
          ),
        );
        end = new Date(
          Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            23,
            59,
            59,
          ),
        );
        useHourly = true;
        break;
      case 'yesterday':
        start = new Date(
          Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate() - 1,
            0,
            0,
            0,
          ),
        );
        end = new Date(
          Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate() - 1,
            23,
            59,
            59,
          ),
        );
        useHourly = true;
        break;
      case 'thisWeek':
        start = new Date(
          Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate() - now.getUTCDay() + 1,
            0,
            0,
            0,
          ),
        );
        end = now;
        break;
      case 'last7Days':
        start = new Date(
          Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate() - 7,
            0,
            0,
            0,
          ),
        );
        end = new Date(
          Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate() - 1,
            23,
            59,
            59,
          ),
        );
        break;
      case 'thisMonth':
        start = new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0),
        );
        end = now;
        break;
      case 'lastMonth':
        start = new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1, 0, 0, 0),
        );
        end = new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59),
        );
        break;
      case 'thisYear':
        start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0));
        end = now;
        break;
      default:
        throw new Error('Invalid interval');
    }

    const data = await this.fetchData(start, end);

    if (useHourly) return this.aggregateHourly(data, parameter);
    return this.aggregateDaily(data, parameter);
  }
}
