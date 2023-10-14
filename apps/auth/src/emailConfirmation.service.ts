import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
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

    async generateNumericOTP(length: number) {
        const digits = "0123456789";
        let otp = "";
        for (let i = 0; i < length; i++) {
            otp += digits.charAt(Math.floor(Math.random() * digits.length));
        }
        return otp;
    }

    public async sendOneTimePasswordByEmail(email: string) {

        try {
            const otp = await this.generateNumericOTP(6);

            const user = await this.authRepository.findOne({ email: email.toLowerCase() })

            if (!user) {
                throw new NotFoundException('no user found')
            }

            await this.authRepository.findOneAndUpdate({ email }, {
                $set: { passwordResetOTP: otp }
            })

            const text = `Hi ${user?.firstName} ${user?.lastName},
            Enter this code to complete the reset.
            
            ${otp}`;

            return this.emailService.sendMail({
                to: email,
                subject: "Reset Password",
                text
            })

        } catch (error) {

        }
    }

    public async verifyOneTimePasswordByEmail(email: string, otp: number, res) {
        try {
            const user = await this.authRepository.findOne({ email: email.toLowerCase() });

            if (!user) {
                throw new NotFoundException('No user found');
            }

            if (user.passwordResetOTP === otp) {
                await this.authRepository.findOneAndUpdate({ email }, {
                    $set: { passwordResetOTP: null, isOtpVerified: true }
                })

                return res.status(200).json({ message: 'OTP verified' });
            } else {
                throw new BadRequestException('Invalid OTP');
            }
        } catch (error) {
            return res.status(500).json({ message: 'Internal server error' });
        }
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


