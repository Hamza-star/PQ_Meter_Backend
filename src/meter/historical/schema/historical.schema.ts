import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type HistoricalDocument = Historical & Document;

@Schema({ timestamps: true })
export class Historical {
  @Prop({ type: Object, required: true })
  meterData: any;
}

export const HistoricalSchema = SchemaFactory.createForClass(Historical);
