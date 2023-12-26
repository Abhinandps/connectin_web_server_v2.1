import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';
import { RedisService } from './redis.service';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
    imports: [
        CacheModule.registerAsync({
            isGlobal: true,
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService):Promise<any> => {
                try {
                    return {
                        store: redisStore, 
                        url: configService.get<string>('REDIS_URI'),
                        ttl: 5000,
                    };
                } catch (error) {
                    console.error('Error configuring Redis:', error.message);
                    // Handle the error gracefully (e.g., log, fallback, or provide default values)
                    return {}; // Return an empty configuration or fallback configuration
                }
            },
            inject: [ConfigService],
        }),
    ],
    controllers: [RedisService],
    providers: [RedisService],
})
export class RedisModule { }


// useFactory: async (configService: ConfigService) => 
// ({
//     store: redisStore, 
//     url: configService.get<string>('REDIS_URI'),
//     ttl: 5000,
// }),






