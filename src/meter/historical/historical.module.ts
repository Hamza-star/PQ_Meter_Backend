import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Historical, HistoricalSchema } from './schema/historical.schema';
import { HistoricalService } from './historical.service';
import { HistoricalController } from './historical.controller';
import { HistoricalScheduler } from './historical.scheduler';
import { MeterModule } from '../meter.module';

@Module({
  imports: [
    MeterModule, // import snapshot from here
    MongooseModule.forFeature([
      { name: Historical.name, schema: HistoricalSchema },
    ]),
  ],
  providers: [HistoricalService, HistoricalScheduler],
  controllers: [HistoricalController],
})
export class HistoricalModule {}
