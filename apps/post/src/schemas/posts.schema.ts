import { AbstractDocument } from '@app/common';
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose'
import { Types } from 'mongoose';


@Schema()
export class Creator {
    @Prop({ type: Types.ObjectId })
    userId: Types.ObjectId;

    @Prop()
    firstName: string;

    @Prop()
    lastName: string;

    @Prop({ default: null })
    profileImage: string;

    @Prop({ default: null })
    headline: string;
}


@Schema({ timestamps: true })
export class Comments {

    @Prop()
    _id: string

    @Prop(Creator)
    creator: Creator

    @Prop()
    content: string;

    @Prop()
    replies: Comments[]

    @Prop({ default: 0 })
    likes: number

}


@Schema({ timestamps: true })
export class Likes extends AbstractDocument {
    @Prop(Creator)
    creator: Creator

    @Prop()
    content: string;

}


@Schema({ versionKey: false, timestamps: true })
export class Post extends AbstractDocument {

    @Prop(Creator)
    creator: Creator

    @Prop()
    contentType: string;

    @Prop()
    title: string;

    @Prop()
    contentBody: string;

    @Prop([String])
    attachments: string[]

    @Prop([Comments])
    comments: Comments[]

    @Prop([Likes])
    likes: Likes[]

}


export const PostSchema = SchemaFactory.createForClass(Post)



