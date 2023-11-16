import { AbstractDocument } from "@app/common";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";


@Schema({ versionKey: false, timestamps: true })
export class Subscription extends AbstractDocument {
    @Prop()
    userId: string;

    @Prop()
    billingCycle: string;

    @Prop()
    expiration: Date;


    @Prop()
    invoiceId: string;

    @Prop()
    amount: number;

}


export const PaymentSchema = SchemaFactory.createForClass(Subscription)


