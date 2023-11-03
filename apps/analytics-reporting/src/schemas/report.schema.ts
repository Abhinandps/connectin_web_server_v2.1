import { AbstractDocument } from '@app/common';
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose'
import { Types } from 'mongoose';



@Schema({ versionKey: false, timestamps: true })
export class Report extends AbstractDocument {
    @Prop({ type: String, required: true })
    user_id: string;

    @Prop({ type: String, required: true })
    post_id: string;

    @Prop({ type: String, required: true })
    report_type: string;

    @Prop({ type: Number, default: 0 })
    report_count: number;
}


export const ReportSchema = SchemaFactory.createForClass(Report);

