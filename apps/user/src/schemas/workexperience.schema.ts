import { AbstractDocument } from '@app/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ versionKey: false,timestamps:true })
export class WorkExperience extends AbstractDocument {
    @Prop()
    companyName: string;

    @Prop()
    jobTitle: string;

    @Prop()
    startDate: Date;

    @Prop()
    endDate: Date;

    @Prop()
    jobDescription: string;

    @Prop([String])
    achievements: string[];
}

export const WorkExperienceSchema = SchemaFactory.createForClass(WorkExperience);
