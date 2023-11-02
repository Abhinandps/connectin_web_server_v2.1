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
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (request: any) => {
                    let data;
                    if (request?.body?.reqHeaders?.cookie) {
                        let tokens = request?.body?.reqHeaders?.cookie?.split('; ');

                        for (const token of tokens) {
                            // console.log(token);

                            if (token.startsWith('refresh_token=')) {
                                data = token.substring('refresh_token='.length)
                                break;
                            }
                        }
                    } else if (request?.Authentication) {
                        // check for microservice token verification
                        data = request?.Authentication
                    }

                    if (!data) {
                        return null;
                    }
                    return data;
                },
            ]),
            secretOrKey: configService.get('JWT_REFRESH_TOKEN_SECRET'),
            passReqToCallback: true,
        });
    }
    async validate(req: any, payload: any) {
        const refreshToken = req?.body?.reqHeaders?.cookie?.split('=')[1];

        const user = await this.authService.validateJwtPayload(payload);
        if (!user) {
            throw new UnauthorizedException();
        }
        return { ...user, refresh_token: refreshToken };
    }
}



