
import { ConfigService } from '@nestjs/config';
import { Injectable, NotFoundException, UnauthorizedException, BadRequestException, UseGuards, Get, Request, Response } from '@nestjs/common';
import * as CircuitBreaker from 'opossum';
import { AxiosResponse } from 'axios';
import { Observable } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ServiceRegistryService } from './service-refistry.service';
import { AccessTokenGuard } from './guards/access_token_guard';

@Injectable()
export class CloudGatewayService {
  private circuitBreakers = new Map<string, CircuitBreaker>();

  constructor(
    private readonly configService: ConfigService,
    private httpService: HttpService,
    private serviceRegistry: ServiceRegistryService
  ) { }

  private createCircuitBreaker(serviceName: string): CircuitBreaker {
    const options = {
      timeout: 3000, // If our function takes longer than 3 seconds, trigger a failure
      errorThresholdPercentage: 50, // When 50% of requests fail, open the circuit
      resetTimeout: 5000, // After 5 seconds, try again.
    };

    const breaker = new CircuitBreaker(this.callService.bind(this), options);
    breaker.fallback(() => 'Service Unavailable');
    breaker.on('open', () => console.log(`${serviceName} circuit open`));
    breaker.on('halfOpen', () => console.log(`${serviceName} circuit half-open`));
    breaker.on('close', () => console.log(`${serviceName} circuit closed`));

    this.circuitBreakers.set(serviceName, breaker);
    return breaker;
  }

  private async callService(
    serviceUrl: string,
    path: string,
    method: string,
    body: any = null,
    query: any = {}
  ): Promise<AxiosResponse<any>> {

    const queryString = Object.keys(query)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`)
      .join('&');

    const url = `${this.serviceRegistry.getServiceUrl(serviceUrl)}/${path}?${queryString}`;
    console.log(`forwarding request to ${url}`)

    switch (method.toUpperCase()) {
      case 'GET':
        return this.httpService.get(url).toPromise();
      case 'POST':
        return await this.httpService.post(url, body).toPromise();
      case 'PUT':
        return this.httpService.put(url, body).toPromise();
      case 'DELETE':
        return this.httpService.delete(url).toPromise();
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  }


  async forwardRequest(serviceName: string, path: string, method: string, body: any, query: any): Promise<AxiosResponse<any>> {
    let breaker = this.circuitBreakers.get(serviceName);
    if (!breaker) {
      breaker = this.createCircuitBreaker(serviceName);
    }

    return breaker.fire(serviceName, path, method, body, query);
  }






  // async forwardRequest(path: string, method: string, reqHeaders?: any, data?: any) {

  //   const serviceURL = `${this.configService.get('AUTH_SERVICE_URI')}${path}`;

  //   console.log(`Forwarding request to: ${serviceURL} (Method: ${method})`);

  //   try {
  //     const response = await axios({
  //       method: method,
  //       url: serviceURL,
  //       data: { ...data, reqHeaders },
  //       withCredentials: true
  //     });

  //     return response.data;
  //   } catch (error) {

  //     if (error.response?.status === 404) {
  //       console.error(`Downstream service responded with a 404 error.`);
  //       throw new NotFoundException(error.response?.data);
  //     } else if (error.response?.status === 401) {
  //       console.error('Downstream service responded with a 401 error.');
  //       throw new UnauthorizedException(error.response?.data);
  //     } else {
  //       console.error(`Error forwarding request: ${error.message}`);
  //       throw new BadRequestException(error?.response?.data)
  //     }
  //   }
  // }





  // async forwardUsersRequest(path: string, method: string, reqHeaders?: any, data?: any, queryData?: string) {

  //   const { query }: any = queryData

  //   const serviceURL = `${this.configService.get('USER_SERVICE_URI')}${path}`;

  //   const url = `${serviceURL}${query ? `?query=${query}` : ''}`;

  //   console.log(`Forwarding request to: ${url} (Method: ${method})`);

  //   try {

  //     const response = await axios({
  //       method: method,
  //       url,
  //       data: { ...data, reqHeaders },
  //       withCredentials: true
  //     });


  //     return response.data;
  //   } catch (error) {

  //     if (error.response?.status === 404) {
  //       console.error(`Downstream service responded with a 404 error.`);
  //       throw new NotFoundException(error.response?.data);
  //     } else if (error.response?.status === 401) {
  //       console.error('Downstream service responded with a 401 error.');
  //       throw new UnauthorizedException(error.response?.data);
  //     } else {
  //       console.error(`Error forwarding request: ${error.message}`);
  //       throw new BadRequestException(error?.response?.data)
  //     }
  //   }
  // }





  // async forwardPostsRequest(path: string, method: string, reqHeaders?: any, data?: any, queryData?: string) {

  //   const { query }: any = queryData

  //   const serviceURL = `${this.configService.get('POST_SERVICE_URI')}${path}`;

  //   const url = `${serviceURL}${query ? `?query=${query}` : ''}`;

  //   console.log(`Forwarding request to: ${url} (Method: ${method})`);

  //   try {

  //     const response = await axios({
  //       method: method,
  //       url,
  //       data: { ...data, reqHeaders },
  //       withCredentials: true
  //     });


  //     return response.data;
  //   } catch (error) {

  //     if (error.response?.status === 404) {
  //       console.error(`Downstream service responded with a 404 error.`);
  //       throw new NotFoundException(error.response?.data);
  //     } else if (error.response?.status === 401) {
  //       console.error('Downstream service responded with a 401 error.');
  //       throw new UnauthorizedException(error.response?.data);
  //     } else {
  //       console.error(`Error forwarding request: ${error.message}`);
  //       throw new BadRequestException(error?.response?.data)
  //     }
  //   }
  // }



}