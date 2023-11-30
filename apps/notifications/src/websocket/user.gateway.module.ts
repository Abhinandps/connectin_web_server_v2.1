import { Module } from "@nestjs/common";
import { SocketClient } from "./user.socketClient";

@Module({
    providers: [SocketClient]
})
export class UserGatewayModule { }

