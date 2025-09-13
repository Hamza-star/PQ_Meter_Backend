import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Collection } from 'mongoose';

@Injectable()
export class PqMeterService {
  private source: Collection;

  constructor(@InjectConnection() private readonly connection: Connection) {
    // PQ_Meter_Data collection bind kar di
    this.source = this.connection.collection('PQ_Meter_data');
  }

  // Test: Single document fetch karo
  async testFindOne(): Promise<any> {
    const doc = await this.source.findOne({});
    console.log('Sample Document:', doc);
    return doc;
  }

  // Latest N documents
  async latestDocs(limit = 10): Promise<any[]> {
    const docs = await this.source
      .find({})
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();

    console.log('Latest docs:', docs.length);
    return docs;
  }

  // Aggregation: min, max, avg based on interval + document count
  async aggregateByInterval(interval: string): Promise<any[]> {
    const now = new Date();
    let start: Date;
    let end: Date = new Date();

    // Interval logic
    if (interval === 'today') {
      start = new Date();
      start.setHours(0, 0, 0, 0);
    } else if (interval === 'yesterday') {
      start = new Date();
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(end.getDate() + 1);
    } else if (interval === 'thisWeek') {
      const day = now.getDay();
      start = new Date(now);
      start.setDate(now.getDate() - day);
      start.setHours(0, 0, 0, 0);
    } else if (interval === 'last30days') {
      start = new Date();
      start.setDate(start.getDate() - 30);
    } else {
      start = new Date(0); // sabhi data
    }

    // Aggregation pipeline
    return this.source
      .aggregate([
        {
          $match: {
            timestamp: { $gte: start, $lt: end },
          },
        },
        {
          $addFields: {
            voltage: { $toDouble: '$SAH_MTO_PQM1_VOLTAGE_LINE_1_V' },
            current: { $toDouble: '$SAH_MTO_PQM1_CURRENT_LINE_1_A' },
            power: { $toDouble: '$SAH_MTO_PQM1_ACTIVE_POWER_TOTAL_KW' },
          },
        },
        {
          $group: {
            _id: {
              $dateTrunc: {
                date: '$timestamp',
                unit:
                  interval === 'daily'
                    ? 'day'
                    : interval === 'monthly'
                      ? 'month'
                      : 'hour', // default hourly
              },
            },
            minVoltage: { $min: '$voltage' },
            maxVoltage: { $max: '$voltage' },
            avgVoltage: { $avg: '$voltage' },
            minCurrent: { $min: '$current' },
            maxCurrent: { $max: '$current' },
            avgCurrent: { $avg: '$current' },
            minPower: { $min: '$power' },
            maxPower: { $max: '$power' },
            avgPower: { $avg: '$power' },
            docCount: { $sum: 1 }, // document count
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();
  }
}
