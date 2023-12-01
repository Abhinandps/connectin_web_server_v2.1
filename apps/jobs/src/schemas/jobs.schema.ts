import { AbstractDocument } from "@app/common";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";




@Schema({ versionKey: false, timestamps: true })
export class Job extends AbstractDocument {


    @Prop()
    jobTitle: string;

    @Prop()
    company: string;

    @Prop()
    workPlaceType: string;

    @Prop()
    employeeLocation: string;

    @Prop()
    jobType: string;

    @Prop()
    userId: string;

    @Prop()
    description: string;

    @Prop([])
    skills: string[];

    @Prop()
    isDraft: boolean;

}

export const JobSchema = SchemaFactory.createForClass(Job)

