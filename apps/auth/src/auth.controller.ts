import { Body, Controller, ExecutionContext, Get, Logger, Param, Post, Query, Request, Response, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserRequest, UserChangePasswordDto, UserOtpDto, UserResetDto, UserSignInDto } from './dto/auth-request.dto';
import { RefreshTokenGuard } from './guards/refresh_token.guard';
import { AccessTokenGuard } from './guards/access_token_guard';
import { EmailConfirmationService } from './emailConfirmation.service';
import { EventPattern, MessagePattern } from '@nestjs/microservices';
import { User } from './schemas/user.schema';
import { CurrentUser } from './current-user.decorator';

@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailConfirmationService: EmailConfirmationService
  ) { }


  @MessagePattern('test-kafka-topic')
  async handleTestKafkaMessage(data: any): Promise<string> {
    // Handle the test Kafka message
    console.log('Received test Kafka message:', data);
    return 'Test Kafka message sented back to post service.';
  }

  // validate user approch one
  @UseGuards(RefreshTokenGuard)
  @MessagePattern('validate_user')
  async validateUser(@CurrentUser() user: User) {
    console.log(user, "reached");

    return user;
  }


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
    @Body() body: { data: UserSignInDto },
    @Request() req,
    @Response() res
  ) {
    console.log(body.data)
    const response = await this.authService.validateUserByPassword(body.data);

    return res.json(response)
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
    console.log(user)
    const response = await this.authService.refreshToken(user)
    // res.cookie("access_token", response.access_token, {
    //   httpOnly: true,
    //   expires: response.access_token_expires_at
    // })

    return res.json(response)
  }



  @UseGuards(RefreshTokenGuard)
  @Get('/validate-token')
  public async fetchDataBasedOnToken(@Request() req, @Response() res) {
    const user = req.user
    console.log(user)
    return res.json({
      _id: user._id,
      email: user.email,
      role: user.role
    })
  }

  // admin 

  @Get('/get_all_admin')
  async getAllAdmins() {
    return await this.authService.getModeratorIdsAndEmails()
  }


  @Get('/get_all_role_users')
  async getAllRoleUsers() {
    return await this.authService.getUsersIdsAndEmails()
  }


  @Post(':userID/add-admin')
  async addAdmin(@Response() res, @Param('userID') userID: string) {
    await this.authService.addNewAdmin(userID)
    return res.status(200).json({ message: 'success' })
  }


  
  @Post(':userID/remove-admin')
  async removeAdmin(@Response() res, @Param('userID') userID: string) {
    await this.authService.removeAdmin(userID)
    return res.status(200).json({ message: 'success' })
  }


}
