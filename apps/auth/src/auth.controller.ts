import { Body, Controller, Get, Logger, Post, Request, Response, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserRequest, UserSignInDto } from './dto/auth-request.dto';
import { RefreshTokenGuard } from './guards/refresh_token.guard';
import { AccessTokenGuard } from './guards/access_token_guard';
import { EmailConfirmationService } from './emailConfirmation.service';

@Controller('auth')
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
    await this.emailConfirmationService.sendVerificationLink(response?.email, response.access_token)
    

    res.cookie("access_token", response.access_token, {
      httpOnly: true
    })

    res.cookie("refresh_token", response.refresh_token, {
      httpOnly: true
    })
    return res.send(response)
  }



  @Post('/login')
  public async login(
    @Body() body: UserSignInDto,
    @Request() req,
    @Response() res
  ) {
    const response = await this.authService.validateUserByPassword(body);

    res.cookie("access_token", response.access_token, {
      httpOnly: true,
      expires: response.access_token_expires_at
    })

    res.cookie("refresh_token", response.refresh_token, {
      httpOnly: true,
      expires: response.refresh_token_expires_at
    })
    return res.send(response)
  }


  // @UseGuards(AccessTokenGuard)
  @Get("logout")
  public async logout(
    @Request() req, @Response() res
  ) {
    res.cookie("access_token", "", {
      httpOnly: true,
    });
    res.cookie("refresh_token", "", {
      httpOnly: true,
    });
    //await this.service.logout(req.user)
    return res.send('logout');
  }


  @UseGuards(RefreshTokenGuard)
  @Post('/refresh')
  public async refreshToken(@Request() req, @Response() res) {
    const user = req.user;
    const response = await this.authService.refreshToken(user)
    res.cookie("access_token", response.access_token, {
      httpOnly: true,
      expires: response.access_token_expires_at
    })
    return res.send(response)
  }

}
