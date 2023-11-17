import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { JwtPayload } from "jsonwebtoken";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "../auth.service";


@Injectable()
export class RefreshTokenJwtStrategy extends PassportStrategy(
    Strategy,
    "jwt-refresh"
) {

    private extractedData: string | null = null
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (request: any) => {


                    if (request?.body?.headers?.cookie) {
                        let tokens = request?.body?.headers?.cookie?.split('; ');

                        for (const token of tokens) {
                            if (token.startsWith('refresh_token=')) {
                                this.extractedData = token.substring('refresh_token='.length)
                                break;
                            }
                        }
                    } else if (request?.Authentication) {
                        // check for microservice token verification
                        this.extractedData = request?.Authentication
                    }

                    if (!this.extractedData) {
                        return null;
                    }
                    return this.extractedData;
                },
            ]),
            secretOrKey: configService.get('JWT_REFRESH_TOKEN_SECRET'),
            passReqToCallback: true,
        });
    }
    async validate(req: any, payload: any) {

        const refreshToken = this.extractedData

        const user = await this.authService.validateJwtPayload(payload);
        if (!user) {
            throw new UnauthorizedException();
        }
        return { ...user, refresh_token: refreshToken };
    }
}



