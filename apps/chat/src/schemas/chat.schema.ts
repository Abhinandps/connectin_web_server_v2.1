import { AbstractDocument } from "@app/common";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";


@Schema({ versionKey: false, timestamps: true })
export class Chat extends AbstractDocument {
    @Prop({
        type: [
            {
                userId: String,
                firstName: String,
                lastName: String,
                headline: String,
                profileImage: String,
            },
        ],
    })
    participants: Array<{
        userId: string;
        firstName: string;
        lastName: string;
        headline?: string;
        profileImage?: string;
    }>;

    @Prop({
        type: [
            {
                sender: String,
                content: String,
                timestamp: Date,
                isViewed: Boolean,
            },
        ],
    })
    messages: Array<{ sender: string; content: string | any; timestamp: Date, isViewed: boolean }>;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);


