

import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config';
import { KafkaOptions, Transport } from '@nestjs/microservices';

@Injectable()
export class KafkaService {
    // static getOptions(arg0: string): KafkaOptions {
    //   throw new Error('Method not implemented.');
    // }
    // public(arg0: string, arg1: { user: import("../../../../apps/auth/src/schemas/user.schema").User; }) {
    //   throw new Error('Method not implemented.');
    // }
    // subscribeTo(arg0: string, arg1: any) {
    //   throw new Error('Method not implemented.');
    // }
    constructor(
        private readonly configService: ConfigService,
    ) { }

    
    getOptions(groupId: string): KafkaOptions {
        return {
            transport: Transport.KAFKA,
            options: {
                client: {
                    brokers: [this.configService.get<string>('KAFKA_BROKER_URL')],
                },
                consumer: {
                    groupId,
                },
                producer: {
                    allowAutoTopicCreation: true,
                }
            }
        }
    }

}