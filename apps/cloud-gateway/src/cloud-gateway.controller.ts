import { All, Controller, Get, Post, Query, Body, Request, Response, UseGuards, UploadedFiles } from '@nestjs/common';
import { CloudGatewayService } from './cloud-gateway.service';
import { JwtAuthGuard } from '@app/common';

@Controller()
export class CloudGatewayController {
  constructor(
    private readonly cloudGatewayService: CloudGatewayService
  ) { }

  @All('auth/*')
  async handleAllRequests(@Request() req, @Response() res) {

    const response = await this.cloudGatewayService.forwardRequest(req.path, req.method, req?.headers, req.body);
    console.log(response, 'response');

    if (response?.access_token_expires_at) {
      res.cookie('access_token', response.access_token, {
        httpOnly: false,
        path: '/',
        expires: new Date(response.access_token_expires_at),
        domain: 'localhost',
        sameSite: 'None',
        secure: true
      });
    }

    if (response?.refresh_token_expires_at) {
      res.cookie('refresh_token', response.refresh_token, {
        httpOnly: false,
        path: '/',
        expires: new Date(response.refresh_token_expires_at),
        domain: 'localhost',
        sameSite: 'None',
        secure: true

      });
    }

    res.send(response)
  }

  @All('users/*')
  async handleAllUsersRequest(@Request() req, @Response() res) {
    const response = await this.cloudGatewayService.forwardUsersRequest(req.path, req.method, req?.headers, req.body, req?.query);
    res.send(response.data);
  }


  @All('posts/*')
  async handleAllPostsRequest(@Body() request, @UploadedFiles() files, @Request() req, @Response() res) {

    const requestData = req.body;
    const uploadedFiles = files
    

    const response = await this.cloudGatewayService.forwardPostsRequest(
      req.path,
      req.method,
      req?.headers,
      { ...requestData, files: uploadedFiles },
      req?.query);

    res.send(response.data || response);
  }

}


