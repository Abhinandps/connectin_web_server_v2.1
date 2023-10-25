import { Body, Controller, Get, Logger, Post, Request, Response, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserRequest, UserChangePasswordDto, UserOtpDto, UserResetDto, UserSignInDto } from './dto/auth-request.dto';
import { RefreshTokenGuard } from './guards/refresh_token.guard';
import { AccessTokenGuard } from './guards/access_token_guard';
import { EmailConfirmationService } from './emailConfirmation.service';

@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailConfirmationService: EmailConfirmationService
  ) { }

  @Post('/register')
  public async createUser(
    @Body() body: CreateUserRequest,
    @Request() req,
    @Response() res
  ) {
    const response = await this.authService.create(body)
    await this.emailConfirmationService.sendVerificationLink(response?.user?.email, response.refresh_token)
    return res.send(response)
  }



  @Post('/login')
  public async login(
    @Body() body: UserSignInDto,
    @Request() req,
    @Response() res
  ) {

    const response = await this.authService.validateUserByPassword(body);
    return res.send(response)
  }


  @Post('request-password-reset')
  async forgotPassword(
    @Body() body: UserResetDto
  ) {
    return await this.emailConfirmationService.sendOneTimePasswordByEmail(body?.email)
  }


  @Post('verify-request-reset')
  async verifyOTP(
    @Body() body: UserOtpDto,
    @Response() res
  ) {
    return await this.emailConfirmationService.verifyOneTimePasswordByEmail(body?.email, body?.otp, res)
  }


  @Post('change-password')
  async changePassword(
    @Body() body: UserChangePasswordDto
  ) {
    const response = await this.authService.changeNewPassword(body)
    return response;
  }


  // @UseGuards(AccessTokenGuard)
  @Get("logout")
  public async logout(
    @Request() req, @Response() res
  ) {
    const response = await this.authService.logout()
    return res.send(response)
  }


  @UseGuards(RefreshTokenGuard)
  @Post('/refresh')
  public async refreshToken(@Request() req, @Response() res) {

    const user = req.user;
    const response = await this.authService.refreshToken(user)
    // res.cookie("access_token", response.access_token, {
    //   httpOnly: true,
    //   expires: response.access_token_expires_at
    // })
    return res.send(response)
  }

  @UseGuards(RefreshTokenGuard)
  @Get('/validate-token')
  public async fetchDataBasedOnToken(@Request() req, @Response() res) {
    const user = req.user
    return res.send({
      _id: user._id,
      email: user.email,
      role: user.role
    })
  }

}
