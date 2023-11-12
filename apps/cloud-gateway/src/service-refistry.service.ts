import { Injectable } from "@nestjs/common";



@Injectable()
export class ServiceRegistryService {
    private services = new Map<string, { urls: string[], openRoutes: string[] }>();
    private roundRobinCounters = new Map<string, number>();

    registerService({ name, urls, openRoutes }: { name: string, urls: string[], openRoutes: string[] }) {
        this.services.set(name, { urls, openRoutes })
        this.roundRobinCounters.set(name, 0)
    }

    getServiceUrl(name: string): string | undefined {
        const service = this.services.get(name);
        if (!service) {
            return undefined;
        }
        // Round-robin load balancing
        let counter = this.roundRobinCounters.get(name) || 0;
        const url = service.urls[counter % service.urls.length];
        this.roundRobinCounters.set(name, counter + 1);
        return url;
    }


    getService(name: string): { urls: string[], openRoutes: string[] } | undefined {
        return this.services.get(name);
    }

}