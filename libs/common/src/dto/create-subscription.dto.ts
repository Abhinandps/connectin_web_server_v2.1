import { Type } from "class-transformer";
import { IsDate, IsDefined, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";

import { CreateChargeDto } from "@app/common/dto";


export enum BillingCycle {
    Monthly = 'monthly',
    Annually = 'annually',
}

export class CreateSubscriptionDto {
    @IsEnum(BillingCycle)
    billingCycle: BillingCycle;

    @IsDate()
    @Type(() => Date)
    expiration: Date;

    @IsDefined()
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => CreateChargeDto)
    charge: CreateChargeDto

    @IsOptional()
    invoiceId: string

}