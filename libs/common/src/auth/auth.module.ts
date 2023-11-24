
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import cookieParser from 'cookie-parser';

import { AUTH_SERVICE } from './services';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
    imports: [KafkaModule.register({ name: AUTH_SERVICE })],
    exports: [KafkaModule],
})

export class AuthModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(cookieParser()).forRoutes('*');
    }
}




