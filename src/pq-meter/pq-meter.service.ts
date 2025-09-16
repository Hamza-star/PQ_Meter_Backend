import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Collection } from 'mongoose';
import { DateTime } from 'luxon';

@Injectable()
export class PqMeterService {
  private source: Collection;

  constructor(@InjectConnection() private readonly connection: Connection) {
    this.source = this.connection.collection('sample_data');
  }

  async aggregateByInterval(interval: string): Promise<any[]> {
    const now = DateTime.now().setZone('Asia/Karachi');
    let start: DateTime;
    let end: DateTime;
    let unit: 'hour' | 'day';

    switch (interval) {
      case 'today':
        start = now.startOf('day');
        end = now.endOf('day');
        unit = 'hour';
        break;
      case 'yesterday':
        start = now.minus({ days: 1 }).startOf('day');
        end = now.minus({ days: 1 }).endOf('day');
        unit = 'hour';
        break;
      case 'thisWeek':
        start = now.startOf('week');
        end = now.endOf('day');
        unit = 'day';
        break;
      case 'lastWeek':
        start = now.minus({ weeks: 1 }).startOf('week');
        end = start.plus({ days: 6 }).endOf('day');
        unit = 'day';
        break;
      case 'thisMonth':
        start = now.startOf('month');
        end = now.endOf('day');
        unit = 'day';
        break;
      case 'lastMonth':
        start = now.minus({ months: 1 }).startOf('month');
        end = start.endOf('month');
        unit = 'day';
        break;
      default:
        throw new Error('Invalid interval');
    }

    // Convert start/end to UTC for $match
    const startUTC = start.toUTC().toJSDate();
    const endUTC = end.toUTC().toJSDate();

    const result = await this.source
      .aggregate([
        { $match: { timestamp: { $gte: startUTC, $lte: endUTC } } },
        {
          $addFields: {
            voltage: {
              $toDouble: {
                $trim: {
                  input: {
                    $replaceAll: {
                      input: '$SAH_MTO_PQM1_VOLTAGE_LINE_1_V',
                      find: ',',
                      replacement: '',
                    },
                  },
                },
              },
            },
            current: {
              $toDouble: {
                $trim: {
                  input: {
                    $replaceAll: {
                      input: '$SAH_MTO_PQM1_CURRENT_LINE_1_A',
                      find: ',',
                      replacement: '',
                    },
                  },
                },
              },
            },
            power: {
              $toDouble: {
                $trim: {
                  input: {
                    $replaceAll: {
                      input: '$SAH_MTO_PQM1_ACTIVE_POWER_TOTAL_KW',
                      find: ',',
                      replacement: '',
                    },
                  },
                },
              },
            },
          },
        },
        {
          $group: {
            _id: {
              $dateTrunc: {
                date: '$timestamp',
                unit,
                timezone: 'Asia/Karachi',
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
            docCount: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    return result;
  }

  // Optional: latest documents for debugging
  async latestDocs(limit = 10): Promise<any[]> {
    return this.source.find({}).sort({ timestamp: -1 }).limit(limit).toArray();
  }
}
