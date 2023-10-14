import { AbstractDocument } from "@app/common";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";


enum UserRole {
    USER = "user",
    ADMIN = 'admin',
    MODERATOR = 'moderator'
}

@Schema({ versionKey: false })
export class User extends AbstractDocument {

    @Prop()
    email: string;

    @Prop()
    isEmailConfirmed: boolean;

    @Prop()
    isOtpVerified: boolean;

    @Prop()
    password: string;

    @Prop()
    firstName: string;

    @Prop()
    lastName: string

    @Prop({ default: null })
    passwordResetOTP: number

    @Prop({ default: null })
    refresh_token: string

    @Prop({ type: String, enum: Object.values(UserRole) })
    role: string
}

export const UserSchema = SchemaFactory.createForClass(User)
