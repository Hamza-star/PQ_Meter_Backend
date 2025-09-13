import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { MeterController } from './meter.controller';
import { MeterService } from './meter.service';
import { Snapshot, SnapshotSchema } from './schema/snapshot.schema';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([
      { name: Snapshot.name, schema: SnapshotSchema },
    ]),
  ],
  controllers: [MeterController],
  providers: [MeterService],
})
export class MeterModule {}
