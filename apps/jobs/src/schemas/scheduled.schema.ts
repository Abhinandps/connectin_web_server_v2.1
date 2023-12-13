import { AbstractDocument } from "@app/common";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";


@Schema({ versionKey: false, timestamps: true })
export class Scheduled extends AbstractDocument {


    @Prop()
    interviewer: string;

    @Prop()
    interviewe: string;

    @Prop()
    userId: string

    @Prop()
    hiringManager: string

    @Prop()
    eventType: string;

    @Prop()
    startDate: Date;

    @Prop()
    endDate: Date;

    @Prop()
    roomName: string;

    @Prop()
    roomUrl: string;

    @Prop()
    meetingId: string;

    @Prop()
    hostRoomUrl: string;

}

export const ScheduledSchema = SchemaFactory.createForClass(Scheduled)

