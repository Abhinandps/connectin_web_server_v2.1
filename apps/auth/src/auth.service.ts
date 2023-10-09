import { Injectable, ConflictException, UnprocessableEntityException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CreateUserRequest, UserSignInDto } from './dto/auth-request.dto';
import { AuthRepository } from './auth.repository';
import * as bcrypt from 'bcrypt'
import { User } from './schemas/user.schema';


export interface JwtPayload {
  userId: any;
  email: string;
  role: string;
}


@Injectable()
export class AuthService {

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }


  async validateUserByPassword(payload: UserSignInDto) {
    const { email, password } = payload;
    const user = await this.authRepository.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new NotFoundException()
    }

    let isMatch = false;

    isMatch = await this.comparePassword(password, user.password)

    if (isMatch) {
      const data = await this.createToken(user);
      await this.updateRefreshTokenByEmail(user.email, data.refresh_token)
      return data;
    } else {
      throw new NotFoundException('user with email password not found')
    }

  }

  async create(userInput: CreateUserRequest) {
    await this.validateCreateUserRequest(userInput)
    const pass = await this.hashPassword(userInput.password)
    try {

      const user = await this.authRepository.create({
        ...userInput,
        email: userInput?.email?.toLowerCase(),
        firstName: userInput?.firstName?.toLowerCase(),
        lastName: userInput?.lastName?.toLowerCase(),
        password: pass,
        isEmailConfirmed: false,
        refresh_token: null
      })

      if (user) {
        const data = await this.createToken(user);
        await this.updateRefreshTokenByEmail(user.email, data.refresh_token)
        return data;
      }

    } catch (err) { }

  }

  public async refreshToken(user: User) {
    const { _id, refresh_token, email } = user;
    const userData = await this.authRepository.findOne({ email })
    if (!userData) {
      throw new ForbiddenException()
    }

    const isMatchFound = await bcrypt.compare(
      refresh_token,
      userData.refresh_token
    )

    if (!isMatchFound) {
      throw new ForbiddenException();
    }

    const tokens = await this.reCreateAccessToken(user);
    return tokens;
  }



  // from refresh_jwt strategy
  public async validateJwtPayload(payload: JwtPayload) {
    const data = await this.authRepository.findOne({ email: payload.email })
    delete data.password;
    return data;
  }


  async hashPassword(password: string) {
    return await bcrypt.hash(password, 10)
  }


  public async reCreateAccessToken(user: User) {
    const data: JwtPayload = {
      userId: user._id,
      email: user.email,
      role: user.role
    };

    const accessToken = await
      this.jwtService.signAsync(data, {
        secret: this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
        expiresIn: this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION_TIME')
      })

    const access_token_expires_at = new Date();
    access_token_expires_at.setSeconds(
      access_token_expires_at.getSeconds() + parseInt(this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION_TIME'), 10),
    );

    return {
      ...data,
      access_token: accessToken,
      access_token_expires_at
    };
  }


  public async createToken(user: User) {

    const data: JwtPayload = {
      userId: user._id,
      email: user.email,
      role: user.role
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(data, {
        secret: this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
        expiresIn: this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION_TIME')
      }),

      this.jwtService.signAsync(data, {
        secret: this.configService.get('JWT_REFRESH_TOKEN_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION_TIME')
      })
    ])

    const access_token_expires_at = new Date();
    access_token_expires_at.setSeconds(
      access_token_expires_at.getSeconds() + parseInt(this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION_TIME'), 10),
    );


    const refresh_token_expires_at = new Date();
    refresh_token_expires_at.setDate(
      refresh_token_expires_at.getDate() + parseInt(this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION_TIME')),
    );

    return {
      ...data,
      access_token: accessToken,
      refresh_token: refreshToken,
      access_token_expires_at,
      refresh_token_expires_at
    };
  }


  hashData(token: string) {
    return bcrypt.hash(token, 10)
  }

  private async updateRefreshTokenByEmail(email: string, refToken: string) {

    if (!refToken) {
      await this.authRepository.findOneAndUpdate({ email: email.toLowerCase() }, {
        $set: { refresh_token: null }
      })
    }

    const hashedToken = await this.hashData(refToken)
    await this.authRepository.findOneAndUpdate({ email: email.toLowerCase() }, {
      $set: { refresh_token: hashedToken }
    })
  }


  private async validateCreateUserRequest(request: CreateUserRequest) {
    let user: User;
    try {
      user = await this.authRepository.findOne({
        email: request.email,
      })
    } catch (err) { }

    if (user) {
      throw new UnprocessableEntityException('Email alredy exists.')
    }
  }


  private async comparePassword(enteredPassword, dbPassword) {
    return await bcrypt.compare(enteredPassword, dbPassword);
  }

}
