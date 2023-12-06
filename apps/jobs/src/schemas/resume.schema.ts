import { AbstractDocument } from "@app/common";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";


@Schema({ versionKey: false, timestamps: true })
export class Resumes extends AbstractDocument {

    @Prop()
    userId: string;

    @Prop()
    resume: string;

}

export const ResumeSchema = SchemaFactory.createForClass(Resumes)


