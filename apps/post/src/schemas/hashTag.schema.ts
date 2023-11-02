

import { AbstractDocument } from '@app/common';
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose'
import { Types } from 'mongoose';


@Schema({ versionKey: false, timestamps: true })
export class HashTag extends AbstractDocument {

    @Prop({ required: true, unique: true })
    name: string;

    @Prop({ type: [{ type: Types.ObjectId, ref: 'Post' }], default: [] })
    posts: string[];

    @Prop({ default: 0 })
    followers: number

    @Prop({ type: Types.ObjectId, ref: 'User' })
    creator: string;

}


export const HashTagSchema = SchemaFactory.createForClass(HashTag)



