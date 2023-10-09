import { Injectable, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import EmailService from "./email.service";
import { AuthRepository } from "./auth.repository";


@Injectable()
export class EmailConfirmationService {
    constructor(
        private readonly configService: ConfigService,
        private readonly authRepository: AuthRepository,
        private readonly emailService: EmailService,
    ) { }

    public sendVerificationLink(email: string, token: string) {

        const url = `${this.configService.get('EMAIL_CONFIRMATION_URL')}?token=${token}`;

        const text = `Welcome to the application. To confirm the email address, click here: ${url}`;

        return this.emailService.sendMail({
            to: email,
            subject: 'Email confirmation',
            text,
        })
    }

    // pending...
    // public async resendConfirmationLink({ userId, role }, token: string) {
    //     const user = await this.userService.getUser({ _id: userId, role });
    //     if (user.isEmailConfirmed) {
    //         throw new BadRequestException('Email already confirmed');
    //     }
    //     await this.sendVerificationLink(user?.email, user?.role);
    // }

    public async confirmEmail({ userId, email, isEmailConfirmed }, res) {

        if (isEmailConfirmed) {
            throw new BadRequestException('Email already confirmed');
        }

        await this.authRepository.findOneAndUpdate({ email }, {
            $set: { isEmailConfirmed: true }
        })

        res.status(200).json({ message: "confirmed" })

    }


}


