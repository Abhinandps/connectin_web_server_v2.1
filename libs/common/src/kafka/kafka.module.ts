import { DynamicModule, Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { ConfigService } from "@nestjs/config";
import { KafkaService } from "./kafka.service";


interface KafkaModuleOptions {
    name: string;
    transport?: Transport;
}

@Module({
    providers: [KafkaService],
    exports: [KafkaService],
})

export class KafkaModule {
    static register({ name }: KafkaModuleOptions): DynamicModule {
        return {
            module: KafkaModule,
            imports: [
                ClientsModule.register([
                    {
                        name: `${name}_SERVICE`,
                        transport: Transport.KAFKA,
                        options: {
                            client: {
                                brokers: ['localhost:9092'],
                            },
                            consumer: {
                                groupId: `${name}-CONSUMER`,
                            },
                        },
                    },
                ])
            ],
            providers: [
                {
                    provide: 'KAFKA_OPTIONS',
                    useFactory: async (configService: ConfigService) => {
                        try {
                            return {
                                transport: Transport.KAFKA,
                                options: {
                                    client: {
                                        brokers: [configService.get<string>('KAFKA_BROKER_URL')],
                                    },
                                    consumer: {
                                        groupId: configService.get<string>(`${name}-CONSUMER`),
                                    },
                                },
                            };
                        } catch (error) {
                            console.error('Error configuring Kafka:', error.message);
                            return {}; 
                        }
                    },
                    inject: [ConfigService],
                }
            ],
            exports: [ClientsModule]
        };
    }
}



// useFactory: (configService: ConfigService) => ({
//     transport: Transport.KAFKA,
//     options: {
//         client: {
//             brokers: [configService.get<string>('KAFKA_BROKER_URL')],
//         },
//         consumer: {
//             groupId: configService.get<string>(`${name}-CONSUMER`),
//         },
//     },
// }),