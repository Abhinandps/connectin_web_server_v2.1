import { AbstractDocument } from "@app/common";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";


@Schema({ versionKey: false, timestamps: true })
export class Apply extends AbstractDocument {


    @Prop()
    jobId: string;

    @Prop()
    hiringManager: string;

    @Prop()
    userId: string;

    @Prop()
    email: string;

    @Prop()
    mobile: string;

    @Prop()
    resume: string;

    @Prop()
    isApproved: boolean;

}

export const ApplySchema = SchemaFactory.createForClass(Apply)

