
import { ConfigService } from '@nestjs/config';
import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { Response } from 'express';

@Injectable()
export class CloudGatewayService {
  constructor(
    private readonly configService: ConfigService
  ) { }

  async forwardRequest(path: string, method: string, reqHeaders?: any, data?: any) {

    const serviceURL = `${this.configService.get('AUTH_SERVICE_URI')}${path}`;

    console.log(`Forwarding request to: ${serviceURL} (Method: ${method})`);

    try {
      const response = await axios({
        method: method,
        url: serviceURL,
        data: { ...data, reqHeaders },
        withCredentials: true
      });

      return response.data;
    } catch (error) {

      if (error.response?.status === 404) {
        console.error(`Downstream service responded with a 404 error.`);
        throw new NotFoundException(error.response?.data);
      } else if (error.response?.status === 401) {
        console.error('Downstream service responded with a 401 error.');
        throw new UnauthorizedException(error.response?.data);
      } else {
        console.error(`Error forwarding request: ${error.message}`);
        throw new BadRequestException(error?.response?.data)
      }
    }
  }


  async forwardUsersRequest(path: string, method: string, reqHeaders?: any, data?: any, queryData?: string) {

    const { query }: any = queryData

    const serviceURL = `${this.configService.get('USER_SERVICE_URI')}${path}`;

    const url = `${serviceURL}${query ? `?query=${query}` : ''}`;

    console.log(`Forwarding request to: ${url} (Method: ${method})`);

    try {

      const response = await axios({
        method: method,
        url,
        data: { ...data, reqHeaders },
        withCredentials: true
      });


      return response.data;
    } catch (error) {

      if (error.response?.status === 404) {
        console.error(`Downstream service responded with a 404 error.`);
        throw new NotFoundException(error.response?.data);
      } else if (error.response?.status === 401) {
        console.error('Downstream service responded with a 401 error.');
        throw new UnauthorizedException(error.response?.data);
      } else {
        console.error(`Error forwarding request: ${error.message}`);
        throw new BadRequestException(error?.response?.data)
      }
    }
  }


  async forwardPostsRequest(path: string, method: string, reqHeaders?: any, data?: any, queryData?: string) {

    const { query }: any = queryData
    


    const serviceURL = `${this.configService.get('POST_SERVICE_URI')}${path}`;

    const url = `${serviceURL}${query ? `?query=${query}` : ''}`;

    console.log(`Forwarding request to: ${url} (Method: ${method})`);

    try {

      const response = await axios({
        method: method,
        url,
        data: { ...data, reqHeaders },
        withCredentials: true
      });


      return response.data;
    } catch (error) {

      if (error.response?.status === 404) {
        console.error(`Downstream service responded with a 404 error.`);
        throw new NotFoundException(error.response?.data);
      } else if (error.response?.status === 401) {
        console.error('Downstream service responded with a 401 error.');
        throw new UnauthorizedException(error.response?.data);
      } else {
        console.error(`Error forwarding request: ${error.message}`);
        throw new BadRequestException(error?.response?.data)
      }
    }
  }



}