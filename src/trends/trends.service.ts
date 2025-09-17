/* eslint-disable @typescript-eslint/no-unsafe-return */
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
    this.db = this.client.db('sample-data');
    this.pqCollection = this.db.collection('P');

    // ⚡ Ensure index on timestamp for fast filtering
    await this.pqCollection.createIndex({ timestamp: 1 });
    console.log('Connected and index ensured on timestamp');
  }

  async onModuleDestroy() {
    await this.client.close();
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

  private async aggregateInMongo(
    parameter: 'Voltage' | 'Current' | 'Power',
    start: Date,
    end: Date,
    groupBy: 'hour' | 'day' | 'month',
  ) {
    const fields = this.getFields(parameter);

    // Step 1: Compute per-document min/max/avg first
    const projectStage: any = {
      $project: {
        timestamp: 1,
        perDocMin: { $min: fields.map((f) => ({ $toDouble: `$${f}` })) },
        perDocMax: { $max: fields.map((f) => ({ $toDouble: `$${f}` })) },
        perDocAvg: { $avg: fields.map((f) => ({ $toDouble: `$${f}` })) },
      },
    };

    const aggData = await this.pqCollection
      .aggregate([
        { $match: { timestamp: { $gte: start, $lte: end } } },
        projectStage,
        {
          $group: {
            _id: { $dateTrunc: { date: '$timestamp', unit: groupBy } },
            min: { $min: '$perDocMin' },
            max: { $max: '$perDocMax' },
            avg: { $avg: '$perDocAvg' },
          },
        },
        {
          $project: {
            _id: 0,
            interval: '$_id',
            parameter: parameter,
            min: 1,
            max: 1,
            avg: 1,
          },
        },
        { $sort: { interval: 1 } },
      ])
      .toArray();

    return aggData;
  }

  private fillMissingIntervals(
    data: any[],
    start: Date,
    end: Date,
    groupBy: 'hour' | 'day' | 'month',
    parameter: 'Voltage' | 'Current' | 'Power',
  ) {
    const filled: any[] = [];
    const cursor = new Date(start);

    while (cursor <= end) {
      let key: Date;
      switch (groupBy) {
        case 'hour':
          key = new Date(
            Date.UTC(
              cursor.getUTCFullYear(),
              cursor.getUTCMonth(),
              cursor.getUTCDate(),
              cursor.getUTCHours(),
            ),
          );
          cursor.setUTCHours(cursor.getUTCHours() + 1);
          break;
        case 'day':
          key = new Date(
            Date.UTC(
              cursor.getUTCFullYear(),
              cursor.getUTCMonth(),
              cursor.getUTCDate(),
            ),
          );
          cursor.setUTCDate(cursor.getUTCDate() + 1);
          break;
        case 'month':
          key = new Date(
            Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), 1),
          );
          cursor.setUTCMonth(cursor.getUTCMonth() + 1);
          break;
      }

      const existing = data.find(
        (d) => new Date(d.interval).getTime() === key.getTime(),
      );
      if (existing) filled.push(existing);
      else
        filled.push({
          interval: key,
          parameter,
          min: null,
          max: null,
          avg: null,
        });
    }

    return filled;
  }

  async getTrend(parameter: 'Voltage' | 'Current' | 'Power', interval: string) {
    const now = new Date();
    let start: Date, end: Date;
    let groupBy: 'hour' | 'day' | 'month' = 'day';

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
        groupBy = 'hour';
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
        groupBy = 'hour';
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
        groupBy = 'day';
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
        groupBy = 'day';
        break;
      case 'thisMonth':
        start = new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0),
        );
        end = now;
        groupBy = 'day';
        break;
      case 'last30Days':
        start = new Date(
          Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate() - 30,
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
        groupBy = 'day';
        break;
      case 'thisYear':
        start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0));
        end = now;
        groupBy = 'month';
        break;
      default:
        throw new Error('Invalid interval');
    }

    const data = await this.aggregateInMongo(parameter, start, end, groupBy);
    return this.fillMissingIntervals(data, start, end, groupBy, parameter);
  }
}
