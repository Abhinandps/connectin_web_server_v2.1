// import {
//     Controller,
//     Post,
//     ClassSerializerInterceptor,
//     UseInterceptors,
//     Body,
//     Req,
//   } from '@nestjs/common';
//   import TokenVerificationDto from './tokenVerification.dto';
//   import { GoogleAuthenticationService } from './googleAuthentication.service';
//   import { Request } from 'express';
   
//   @Controller('/api/v1/auth')
//   @UseInterceptors(ClassSerializerInterceptor)
//   export class GoogleAuthenticationController {
//     constructor(
//       private readonly googleAuthenticationService: GoogleAuthenticationService
//     ) {
//     }
   
//     @Post('google-authentication')
//     async authenticate(@Body() tokenData: TokenVerificationDto, @Req() request: Request) {
//       const {
//         accessTokenCookie,
//         refreshTokenCookie,
//         user
//       } = await this.googleAuthenticationService.authenticate(tokenData.token);
   
//       request.res.setHeader('Set-Cookie', [accessTokenCookie, refreshTokenCookie]);
   
//       return user;
//     }
//   }