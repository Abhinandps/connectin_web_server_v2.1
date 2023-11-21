import { AbstractDocument } from "@app/common";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";



@Schema()
export class Qualifications {
    @Prop()
    education: string;

    @Prop()
    experience: string;

    @Prop({ default: [] })
    methodologies: string[];

    @Prop({ default: [] })
    skills: string[]

}


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

    @Prop({ default: [] })
    responsibilities: string[]

    @Prop([Qualifications])
    qualifications: Qualifications[]

}

export const JobSchema = SchemaFactory.createForClass(Job)

