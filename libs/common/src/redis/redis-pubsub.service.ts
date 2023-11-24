// libs/redis-pubsub/src/lib/redis-pubsub.service.ts

import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisPubSubService {
  private readonly redisClient: Redis;

  constructor() {
    this.redisClient = new Redis();
  }

  publish(channel: string, message: string): Promise<number> {
    return this.redisClient.publish(channel, message);
  }

  subscribe(channel: string, callback: (message: string) => void): void {
    this.redisClient.subscribe(channel, () => {
      this.redisClient.on('message', (_, message) => {
        callback(message);
      });
    });
  }

  onClose() {
    this.redisClient.quit();
  }
}
