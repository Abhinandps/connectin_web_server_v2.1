// user.gateway.ts
import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { CompressionTypes } from 'kafkajs';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
    cors: {
        origin: ['http://localhost:5173']
    }
})

export class Gateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;

    public socketIdByUserId: Record<string, string> = {}
    public pendingNotifications = [];

    handleConnection(client: Socket) {
        const userId = client.handshake.query.userId as string;
        console.log(`Client connected: ${client.id} User ID : ${userId}`);

        this.socketIdByUserId[userId] = client.id;
        console.log('Existing Socket Connections:', Object.keys(this.server.sockets.sockets));


        if (this.pendingNotifications[userId]) {
            const recipientSocketId = this.socketIdByUserId[userId];

            if (recipientSocketId) {
                let recipientSocket: any
                this.server.sockets.sockets.forEach((value, key) => {
                    if (key === recipientSocketId) {
                        recipientSocket = value;
                    }
                });

                // Send pending notifications to the connected user
                for (const notification of this.pendingNotifications[userId]) {
                    if (recipientSocket) {
                        recipientSocket.emit('onScheduleToUser', { notification });
                    }
                }
                // Clear pending notifications
                this.pendingNotifications[userId] = [];
            }
        }
    }


    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);

        // Remove the mapping when a client disconnects
        const userId = Object.keys(this.socketIdByUserId).find(key => this.socketIdByUserId[key] === client.id);
        delete this.socketIdByUserId[userId];
    }

    handleUserRequest(userId: string) {
        // Notify a specific user about a request
        this.server.to(userId).emit('userRequest', { message: 'You have a new connection request' });
    }



    @SubscribeMessage('user_invitation_request')
    onEmitUser(@MessageBody() body: any, @ConnectedSocket() client: Socket) {
        const { receiver } = body;
        const recipientSocketId = this.socketIdByUserId[receiver];

        if (recipientSocketId) {
            let recipientSocket: any
            this.server.sockets.sockets.forEach((value, key) => {
                if (key === recipientSocketId) {
                    recipientSocket = value;
                }
            });
            if (recipientSocket) {
                recipientSocket.emit('onEmitUser', { ...body });
            } else {
                console.log(`Socket for user ${receiver} not found.`);
            }
        } else {
            console.log(`Socket ID for user ${receiver} not found.`);
        }
    }


    @SubscribeMessage('interview_schedule_notification')
    onEmitScheduleNotification(@MessageBody() body: any, @ConnectedSocket() client: Socket) {
        const { notification } = body;
        const userId = notification?.data?.userId
        const recipientSocketId = this.socketIdByUserId[userId];

        if (recipientSocketId) {
            let recipientSocket: any
            this.server.sockets.sockets.forEach((value, key) => {
                if (key === recipientSocketId) {
                    recipientSocket = value;
                }
            });
            if (recipientSocket) {
                recipientSocket.emit('onScheduleToUser', { notification });
            } else {
                console.log(`Socket for user ${userId} not found.`);
            }
        } else {
            if (!this.pendingNotifications[userId]) {
                this.pendingNotifications[userId] = [];
            }
            this.pendingNotifications[userId].push(notification);
            console.log(`Socket ID for user ${userId} not found.`);
        }
    }

}



// ===================================================================================
// ===================================================================================

// @SubscribeMessage('newMessage')
// onNewMessage(@MessageBody() body: any) {
//     console.log(body);

//     const userId = body.userId;
//     const userSocket = this.server.sockets.sockets[userId];

//     if (userSocket) {
//         userSocket.emit('onMessage', {
//             msg: 'New Message',
//             content: body,
//         })
//     } else {
//         console.log(`User with ID ${userId} not found.`);
//     }
// }


// ===================================================================================
// ===================================================================================


// @SubscribeMessage('joinCommonRoom')
// onJoinCommonRoom(@MessageBody() data: { userIdA: string; userIdB: string }, @ConnectedSocket() client: Socket) {
//     const commonRoomId = this.createCommonRoomId(data.userIdA, data.userIdB);
//     console.log(`Users ${data.userIdA} and ${data.userIdB} joined the common room ${commonRoomId}`);
//     client.join(commonRoomId);
// }


// ===================================================================================
// ===================================================================================
