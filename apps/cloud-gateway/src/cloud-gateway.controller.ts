import { All, Controller, Get, HttpStatus, UploadedFiles, Param, Post, Query, Req, Request, Res, Response, UseGuards } from '@nestjs/common';
import { CloudGatewayService } from './cloud-gateway.service';
import { JwtAuthGuard } from '@app/common';
import { AccessTokenGuard } from './guards/access_token_guard';
import { RefreshTokenGuard } from './guards/refresh_token.guard';
import { DynamicRouteGuard } from './strategies/refresh_jwt-strategy';

@Controller()
export class CloudGatewayController {
  constructor(
    private readonly cloudGatewayService: CloudGatewayService
  ) { }

  @UseGuards(DynamicRouteGuard)
  @All(':serviceName/*')
  async forwardRequest(@Request() req, @Response() res, @UploadedFiles() files) {

    const serviceName = req.params.serviceName;
    const path = req.params[0];
    const method = req.method;
    const { userId, email, role, ...rest } = req?.user?.user || {};
    const uploadedFiles = files
    let body = { data: req.body, headers: req.headers, files: uploadedFiles };

    const query = {
      ...req.query,
      ...(userId && { _id: userId }),
      ...(email && { email }),
      ...(role && { role })
    };




    try {
      const result = await this.cloudGatewayService.forwardRequest(serviceName, path, method, body, query);


      const response = result.data

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

      res.status(result.status).json(result.data);
    } catch (error) {
      // res.status(HttpStatus.SERVICE_UNAVAILABLE).json({ error: error.toString() });
    }
  }


  @UseGuards(RefreshTokenGuard)
  @Get('/validate-token')
  public async fetchDataBasedOnToken(@Request() req, @Response() res) {
    const { user } = req.user

    return res.send({
      _id: user.userId,
      email: user.email,
      role: user.role
    })

  }










  // @All('auth/*')
  // async handleAllRequests(@Request() req, @Response() res) {

  //const response = await this.cloudGatewayService.forwardRequest(req.path, req.method, req?.headers, req.body);
  //   console.log(response, 'response');

  //   if (response?.access_token_expires_at) {
  //     res.cookie('access_token', response.access_token, {
  //       httpOnly: false,
  //       path: '/',
  //       expires: new Date(response.access_token_expires_at),
  //       domain: 'localhost',
  //       sameSite: 'None',
  //       secure: true
  //     });
  //   }

  //   if (response?.refresh_token_expires_at) {
  //     res.cookie('refresh_token', response.refresh_token, {
  //       httpOnly: false,
  //       path: '/',
  //       expires: new Date(response.refresh_token_expires_at),
  //       domain: 'localhost',
  //       sameSite: 'None',
  //       secure: true

  //     });
  //   }

  //   res.send(response)
  // }

  // @All('users/*')
  // async handleAllUsersRequest(@Request() req, @Response() res) {
  //   const response = await this.cloudGatewayService.forwardUsersRequest(req.path, req.method, req?.headers, req.body, req?.query);
  //   res.send(response.data);
  // }


  // @All('posts/*')
  // async handleAllPostsRequest(@Request() req, @Response() res) {

  //   const response = await this.cloudGatewayService.forwardPostsRequest(req.path, req.method, req?.headers, req.body, req?.query);
  //   res.send(response.data || response);
  // }




}


