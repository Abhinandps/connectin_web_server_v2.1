import { Prop, Schema } from '@nestjs/mongoose';
import { SaveOptions, SchemaTypes, Types } from 'mongoose';

@Schema()
export class AbstractDocument {
  save(options: SaveOptions): TDocument | PromiseLike<TDocument> {
      throw new Error('Method not implemented.');
  }
  @Prop({ type: SchemaTypes.ObjectId })
  _id: Types.ObjectId;
}


