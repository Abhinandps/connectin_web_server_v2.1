import { AbstractDocument } from '@app/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ versionKey: false ,timestamps:true})
export class Education extends AbstractDocument {
    @Prop()
    schoolName: string;

    @Prop()
    degree: string;

    @Prop()
    fieldOfStudy: string;

    @Prop()
    startDate: Date;

    @Prop()
    endDate: Date;

    @Prop()
    honors: string;
}

export const EducationSchema = SchemaFactory.createForClass(Education);