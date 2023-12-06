

import { Injectable, OnModuleInit } from "@nestjs/common";
import { io, Socket } from "socket.io-client";


@Injectable()

export class SocketClient implements OnModuleInit {
    public socketClient: Socket;

    constructor() {
        this.socketClient = io('http://localhost:3000')
    }

    onModuleInit() {
        this.registerConsumerEvents()
    }

    private registerConsumerEvents() {
        this.socketClient.on('connect', () => {
            console.log('connected to gateway')
        });

        this.socketClient.on('onMessage', (payload: any) => {
            console.log(payload)
        })
    }

    emitInvitationToUser(result: any) {
        console.log(result, 'result')
        this.socketClient.emit('user_invitation_request', {
            ...result
        });
    }

    emitInterviewSchedule(result: any) {
        console.log(result, 'schedule')
        this.socketClient.emit('interview_schedule_notification', {
            ...result
        });
    }



}