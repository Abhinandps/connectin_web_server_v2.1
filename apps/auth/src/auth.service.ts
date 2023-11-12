import { Injectable, ExecutionContext, ConflictException, UnprocessableEntityException, BadRequestException, ForbiddenException, NotFoundException, InternalServerErrorException, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CreateUserRequest, UserChangePasswordDto, UserSignInDto } from './dto/auth-request.dto';
import { AuthRepository } from './auth.repository';
import * as bcrypt from 'bcrypt'
import { User } from './schemas/user.schema';
import { ObjectId, SaveOptions } from 'mongoose';
import { USER_SERVICE } from './constant/services';
import { ClientKafka } from '@nestjs/microservices';
import { UserCreatedEvent } from './dto/user-created.event';


export interface JwtPayload {
  userId: any;
  email: string;
  role: string;
}


interface UserData {
  userId: ObjectId;
  email: string;
  role: string;
}

interface ConvertedData {
  user: UserData,
  access_token: string;
  refresh_token: string;
  access_token_expires_at: Date;
  refresh_token_expires_at: Date;
}


@Injectable()
export class AuthService {

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(USER_SERVICE) private readonly userClient: ClientKafka
  ) { }


  async validateUserByPassword(payload: UserSignInDto) {

    const { email, password } = payload;
    const user = await this.authRepository.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new UnauthorizedException('Invalid username or password.')
    }

    let isMatch = false;

    isMatch = await this.comparePassword(password, user.password)

    if (isMatch) {

      if (!user.isEmailConfirmed) {
        throw new UnauthorizedException('Your email address has not been confirmed.')
      }

      const data = await this.createToken(user);
      await this.updateRefreshTokenByEmail(user.email, data.refresh_token)
      const originalData = data
      const convertedData: ConvertedData = {
        user: {
          userId: originalData?.userId,
          email: originalData?.email,
          role: originalData?.role
        },
        access_token: originalData?.access_token,
        refresh_token: originalData?.refresh_token,
        access_token_expires_at: originalData?.access_token_expires_at,
        refresh_token_expires_at: originalData?.refresh_token_expires_at
      }
      console.log('reached here...')

      return convertedData;
    } else {
      throw new UnauthorizedException('Invalid username or password.')
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
        isOtpVerified: false,
        passwordResetOTP: null,
        refresh_token: null,
        role: 'user',
      })

      if (user) {
        this.userClient.emit('create_user', new UserCreatedEvent(user._id.toString(), user.firstName, user.lastName))

        const data = await this.createToken(user);
        await this.updateRefreshTokenByEmail(user.email, data.refresh_token)
        const originalData = data
        const convertedData: ConvertedData = {
          user: {
            userId: originalData?.userId,
            email: originalData?.email,
            role: originalData?.role
          },
          access_token: originalData?.access_token,
          refresh_token: originalData?.refresh_token,
          access_token_expires_at: originalData?.access_token_expires_at,
          refresh_token_expires_at: originalData?.refresh_token_expires_at
        }

        return convertedData;
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

  async changeNewPassword({ email, newPassword, confirmNewPassword }: UserChangePasswordDto) {
    try {

      if (newPassword !== confirmNewPassword) {
        throw new BadRequestException('New password and confirmation do not match');
      }

      const pass = await this.hashPassword(newPassword)

      const user = await this.authRepository.findOne({ email });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.passwordResetOTP !== null) {
        throw new NotFoundException('Something went wrong');
      }

      if (!user.isOtpVerified) {
        throw new NotFoundException('Something went wrong');
      }

      await this.authRepository.findOneAndUpdate({ email }, {
        $set: { password: pass }
      });

      return { message: 'Password changed successfully' };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      } else if (error instanceof NotFoundException) {
        throw error;
      } else {
        throw new InternalServerErrorException('Password change failed');
      }
    }
  }


  async logout() {

    const access_token_expires_at = new Date();
    access_token_expires_at.setSeconds(
      access_token_expires_at.getSeconds() - 1
    );

    const refresh_token_expires_at = new Date();
    refresh_token_expires_at.setTime(refresh_token_expires_at.getTime() - 1000);

    const response = {
      access_token: "",
      refresh_token: "",
      access_token_expires_at,
      refresh_token_expires_at
    }

    return response;
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



  // admin 

  public async getModeratorIdsAndEmails(): Promise<{ _id: string; email: string }[] | any> {
    const moderators = await this.authRepository.find({ role: "moderator" });
    const moderatorIdsAndEmails = moderators.map((moderator) => {
      return { _id: moderator._id, email: moderator.email };
    });
    return moderatorIdsAndEmails;
  }

  public async getUsersIdsAndEmails(): Promise<{ _id: string; email: string }[] | any> {
    const users = await this.authRepository.find({ role: "user" });
    const usersIdsAndEmails = users.map((user) => {
      return { _id: user._id, email: user.email };
    });
    return usersIdsAndEmails;
  }

  public async addNewAdmin(userID: string): Promise<any> {

    try {
      // Validate the user ID.
      if (!userID) {
        throw new BadRequestException('Invalid user ID.');
      }

      // Find the user.
      const user = await this.authRepository.findOne({ _id: userID });

      // If the user does not exist, throw an error.
      if (!user) {
        throw new NotFoundException('User does not exist.');
      }

      // Check if the user already has the admin role.
      if (user.role === 'moderator') {
        throw new BadRequestException('User already has the admin role.');
      }

      // Update the user's role.
      await this.authRepository.findOneAndUpdate({ _id: userID }, { $set: { role: 'moderator' } });

      // Log the change.
      // this.logger.info(`User ${userID} was granted the moderator role.`);

      // Send a notification.
      // this.notificationService.sendNotification({
      //   type: 'new_moderator',
      //   id: userID
      // });

      // Delete the user's password from the response.
      delete user.password;

      // Delete the user's refresh token from the response.
      delete user.refresh_token;

      // Return the user.
      return user;
    } catch (err) { }
  }


  public async removeAdmin(userID: string): Promise<any> {

    try {
      // Validate the user ID.
      if (!userID) {
        throw new BadRequestException('Invalid user ID.');
      }

      // Find the user.
      const user = await this.authRepository.findOne({ _id: userID });

      // If the user does not exist, throw an error.
      if (!user) {
        throw new NotFoundException('User does not exist.');
      }

      // Check if the user already has the admin role.
      if (user.role === 'user') {
        throw new BadRequestException('User already has the user role.');
      }

      // Update the user's role.
      await this.authRepository.findOneAndUpdate({ _id: userID }, { $set: { role: 'user' } });

      // Log the change.
      // this.logger.info(`User ${userID} was granted the moderator role.`);

      // Send a notification.
      // this.notificationService.sendNotification({
      //   type: 'new_moderator',
      //   id: userID
      // });

      // Delete the user's password from the response.
      delete user.password;

      // Delete the user's refresh token from the response.
      delete user.refresh_token;

      // Return the user.
      return user;
    } catch (err) { }
  }
}
