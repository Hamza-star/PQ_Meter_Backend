// import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
// import { Document } from 'mongoose';

// @Schema()
// export class Snapshot {
//   @Prop({
//     type: {
//       structured: { type: Object, required: true },
//       averages: { type: Object, required: true },
//       raw: { type: Object, required: true },
//     },
//     required: true,
//   })
//   meterData: {
//     structured: Record<string, any>;
//     averages: Record<string, any>;
//     raw: Record<string, any>;
//   };
// }

// export type SnapshotDocument = Snapshot & Document;
// export const SnapshotSchema = SchemaFactory.createForClass(Snapshot);

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
