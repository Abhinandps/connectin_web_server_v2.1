import { DynamicModule, Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { ConfigService } from "@nestjs/config";
import { KafkaService } from "./kafka.service";


interface KafkaModuleOptions {
    name: string;
    transport: Transport;
}

@Module({
    providers: [KafkaService],
    exports: [KafkaService],
})

export class KafkaModule {
    static register({ name }: KafkaModuleOptions): DynamicModule {
        return {
            module: KafkaModule,
            providers: [
                {
                    provide: 'KAFKA_OPTIONS',
                    useFactory: (configService: ConfigService) => ({
                        transport: Transport.KAFKA,
                        options: {
                            client: {
                                brokers: [configService.get<string>('KAFKA_BROKER_URL')],
                            },
                            consumer: {
                                groupId: configService.get<string>(`${name}-CONSUMER    `),
                            },
                        },
                    }),
                    inject: [ConfigService],
                }
            ],
            // exports: [ClientsModule]
        };
    }
}



// ClientsModule.registerAsync([
                //     {
                //         name,

                //     },
                // ]),