import { Module } from "@nestjs/common";
import { SocketClient } from "./user.socketClient";
import { ChatService } from "../chat.service";

@Module({
    providers: [SocketClient]
})
export class UserGatewayModule { }

