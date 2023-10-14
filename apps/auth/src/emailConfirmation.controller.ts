import {
    Controller,
    ClassSerializerInterceptor,
    UseInterceptors,
    Post,
    Body,
    UseGuards,
    Request,
    Response,
    HttpStatus
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

    @UseGuards(RefreshTokenGuard)
    @Post('email-confirmation/confirm')
    async confirm(@Request() req, @Response() res) {
        const user = req.user
        if (user) {
             await this.emailConfirmationService.confirmEmail(user, res)
        };
    }

    

    // @Post('resend-confirmation-link')
    // @UseGuards(JwtAuthGuard)
    // async resendConfirmationLink() {
    //   await this.emailConfirmationService.resendConfirmationLink(payload, token);
    // }

}