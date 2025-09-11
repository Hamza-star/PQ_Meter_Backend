import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SnapshotDocument = Snapshot & Document;

@Schema({ timestamps: true })
export class Snapshot {
  @Prop({ type: Object, required: true })
  meterData: {
    structured: any;
    averages: any;
    raw: any;
  };
}

export const SnapshotSchema = SchemaFactory.createForClass(Snapshot);
