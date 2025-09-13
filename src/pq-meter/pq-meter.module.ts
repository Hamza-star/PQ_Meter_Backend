import { Module } from '@nestjs/common';
import { PqMeterService } from './pq-meter.service';
import { PqMeterController } from './pq-meter.controller';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [MongooseModule],
  providers: [PqMeterService],
  controllers: [PqMeterController],
})
export class PQMeterModule {}
