import { AbstractDocument } from '@app/common';
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose'
import { Types } from 'mongoose';

@Schema()
export class Language {
    @Prop()
    language: string;

    @Prop()
    proficiency: string;
}


@Schema({ versionKey: false, timestamps: true })
export class User extends AbstractDocument {
    @Prop({ type: Types.ObjectId })
    userId: Types.ObjectId;

    @Prop()
    firstName: string;

    @Prop()
    lastName: string;

    @Prop({ default: null })
    headline: string;

    @Prop({ default: null })
    location: string;

    @Prop({ default: null })
    industry: string;

    @Prop({ default: null })
    summary: string;

    @Prop({ default: null })
    profileImage: string;

    @Prop({ default: null })
    coverImage: string;

    @Prop({ type: [{ type: Types.ObjectId, ref: 'Education' }] })
    education: Types.ObjectId[];

    @Prop({ type: [{ type: Types.ObjectId, ref: 'WorkExperience' }] })
    workExperience: Types.ObjectId[];

    @Prop([String])
    skills: string[]

    @Prop([String])
    endorsements: string[]

    @Prop([Language])
    language: Language[]

    @Prop([])
    certifications: []

    @Prop([String])
    interests: string[]

    @Prop({ default: null })
    phone: string;

    @Prop({ default: null })
    website: string;

    @Prop({ default: null })
    linkedin: string;

    @Prop({ default: null })
    twitter: string;

    @Prop({ default: false })
    isPremium: boolean;

    @Prop({ type: [{ type: Types.ObjectId, ref: 'Subscription' }] })
    premium_subscription: Types.ObjectId[]

    @Prop([Types.ObjectId])
    connections: Types.ObjectId[]

}


export const UserSchema = SchemaFactory.createForClass(User);










