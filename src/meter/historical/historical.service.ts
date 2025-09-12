/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Historical, HistoricalDocument } from './schema/historical.schema';

@Injectable()
export class HistoricalService {
  constructor(
    @InjectModel(Historical.name)
    private readonly historicalModel: Model<HistoricalDocument>,
  ) {}

  async getTrends(
    target: string,
    from: Date,
    to: Date,
  ): Promise<{ hour: string; min: number; max: number; avg: number }[]> {
    const pipeline = [
      {
        $match: { createdAt: { $gte: from, $lte: to } },
      },
      {
        $project: {
          hour: { $dateToString: { format: '%H:00', date: '$createdAt' } },
          value: `$meterData.structured.${target}`,
        },
      },
      {
        $group: {
          _id: '$hour',
          min: { $min: '$value' },
          max: { $max: '$value' },
          avg: { $avg: '$value' },
        },
      },
      { $sort: { _id: 1 } },
    ];

    const results = await this.historicalModel
      .aggregate<{
        _id: string;
        min: number;
        max: number;
        avg: number;
      }>(pipeline as any[])
      .exec();

    return results.map((r) => ({
      hour: r._id,
      min: r.min,
      max: r.max,
      avg: r.avg,
    }));
  }
}
