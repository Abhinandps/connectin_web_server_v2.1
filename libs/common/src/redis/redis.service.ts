import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Injectable, Inject } from '@nestjs/common'

@Injectable()
export class RedisService {
    constructor(
        @Inject(CACHE_MANAGER) private readonly cache: Cache
    ) { }


    async get(key: string) {
        console.log(`GET ${key} from REDIS`)
        return await this.cache.keys(key); // cache.get()
    }

    async set(key: string, value: unknown) {
        console.log(`SET ${key} from REDIS`)
        return await this.cache.set(key, value); // cache.set()
    }

    async del(key: string) {
        await this.cache.delete(key)
    }

}