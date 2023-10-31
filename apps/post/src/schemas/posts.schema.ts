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
}


@Schema({ timestamps: true })
export class Comments extends AbstractDocument {
    @Prop(Creator)
    creator: Creator

    @Prop()
    content: string;

    @Prop()
    replies: Comments[]

    @Prop()
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




