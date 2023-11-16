import Stripe from "stripe"
import { CardDto } from "./card.dto";
import { IsDefined, IsNotEmpty, IsNumber, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class CreateChargeDto {
    // @IsDefined()
    // @IsNotEmpty()
    // @ValidateNested()
    // @Type(() => CardDto)
    // card: CardDto;

    @IsNumber()
    amount: number;
    data: { amount: any; };
}