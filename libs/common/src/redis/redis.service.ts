import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Injectable, Inject, Controller } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Controller()
export class RedisService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async get(key: string) {
    console.log(`GET ${key} from REDIS`);
    return await this.cache.get(key);
  }

  async set(key: string, value: unknown) {
    console.log(`SET ${key} from REDIS`);
    return await this.cache.set(key, value);
  }

  async del(key: string) {
    await this.cache.del(key);
  }
}
