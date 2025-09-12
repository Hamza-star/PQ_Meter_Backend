import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Historical, HistoricalDocument } from './schema/historical.schema';
import { Snapshot, SnapshotDocument } from '../schema/snapshot.schema';

@Injectable()
export class HistoricalScheduler {
  private readonly logger = new Logger(HistoricalScheduler.name);

  constructor(
    @InjectModel(Snapshot.name)
    private readonly snapshotModel: Model<SnapshotDocument>,
    @InjectModel(Historical.name)
    private readonly historicalModel: Model<HistoricalDocument>,
  ) {}

  // run every 10 seconds (for testing)
  @Cron('*/10 * * * * *')
  async saveHistoricalSnapshot() {
    try {
      const now = new Date();
      const tenSecondsAgo = new Date(now.getTime() - 10 * 1000);

      this.logger.debug(
        `Looking for snapshots (updatedAt) between ${tenSecondsAgo.toISOString()} and ${now.toISOString()}`,
      );

      // get snapshot updated in last 10s
      const lastSnapshot = await this.snapshotModel
        .findOne({ updatedAt: { $gte: tenSecondsAgo, $lt: now } })
        .sort({ updatedAt: -1 })
        .lean();

      if (!lastSnapshot) {
        this.logger.warn('No snapshot found in the last 10s window');
        return;
      }

      // save new historical doc
      await new this.historicalModel({
        meterData: lastSnapshot.meterData,
      }).save();

      this.logger.log(`✅ Saved historical snapshot from snapshot`);
    } catch (error) {
      this.logger.error('Failed to save historical snapshot', error);
    }
  }
}
