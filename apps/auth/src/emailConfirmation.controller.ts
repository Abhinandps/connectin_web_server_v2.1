import {
    Controller,
    ClassSerializerInterceptor,
    UseInterceptors,
    Post,
    Get,
    Body,
    UseGuards,
    Request,
    Response,
    HttpStatus,
    Query,
    Param
} from '@nestjs/common';
import { EmailConfirmationService } from './emailConfirmation.service';
import { AccessTokenGuard } from './guards/access_token_guard';
import { RefreshTokenGuard } from './guards/refresh_token.guard';
import { AccessTokenJwtStrategy } from './strategies/access_jwt-strategy';

@Controller('/api/v1/auth')
@UseInterceptors(ClassSerializerInterceptor)
export class EmailConfirmationController {
    constructor(
        private readonly emailConfirmationService: EmailConfirmationService
    ) { }

    // @UseGuards(RefreshTokenGuard)
    // @Post('email-confirmation/confirm')
    // async confirm(@Request() req, @Response() res) {
    //     const user = req.user
    //     if (user) {
    //          await this.emailConfirmationService.confirmEmail(user, res)
    //     };
    // }

    @Post('email-confirmation/confirm')
    async confirm(@Body() data: any, @Request() req) {
        try {
            
            const emailConfirmed = await this.emailConfirmationService.confirmEmail(data?.token)
            if (emailConfirmed) {
                return 'Email confirmed successfully.';
            } else {
                return 'Email confirmation failed. Invalid or expired token.';
            }
        } catch (error) {
            return 'Email confirmation failed. ' + error.message;
        }
    }



    // @Post('resend-confirmation-link')
    // @UseGuards(JwtAuthGuard)
    // async resendConfirmationLink() {
    //   await this.emailConfirmationService.resendConfirmationLink(payload, token);
    // }

}