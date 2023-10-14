import { All, Controller, Get, Post, Request, Response } from '@nestjs/common';
import { CloudGatewayService } from './cloud-gateway.service';
import * as cookie from 'cookie'

@Controller()
export class CloudGatewayController {
  constructor(
    private readonly cloudGatewayService: CloudGatewayService
  ) { }

  @All('auth/*')
  async handleAllRequests(@Request() req, @Response() res) {


    const response = await this.cloudGatewayService.forwardRequest(req.path, req.method, req?.headers, req.body);


    if (response?.access_token_expires_at) {
      res.cookie('access_token', response.access_token, {
        httpOnly: true,
        expires: new Date(response.access_token_expires_at),
        domain: '.localhost'
      });
    }

    if (response?.refresh_token_expires_at) {
      res.cookie('refresh_token', response.refresh_token, {
        httpOnly: true,
        expires: new Date(response.refresh_token_expires_at),
        domain: '.localhost'
      });
    }

    res.send(response)
  }

}


