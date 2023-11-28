import { Module } from "@nestjs/common";
import { Gateway } from "./user.gateway";



@Module({
    providers: [Gateway]
})
export class GatewayModule { }