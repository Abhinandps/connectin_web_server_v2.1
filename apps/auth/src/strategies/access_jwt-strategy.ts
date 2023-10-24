import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "../auth.service";


@Injectable()
export class AccessTokenJwtStrategy extends PassportStrategy(Strategy, "jwt") {
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (request: any) => {

                    let tokens = request?.body?.reqHeaders?.cookie.split(';');
                    let data;
                    for (const token of tokens) {
                        if (token.startsWith('access_token=')) {
                            data = token.substring('access_token='.length)
                            break;
                        }
                    }
                    if (!data) {
                        return null;
                    }
                    return data;
                },
            ]),
            secretOrKey: configService.get('JWT_ACCESS_TOKEN_SECRET'),
        });
    }
    async validate(req: any, payload: any) {
        console.log(payload, "payload");

        // let accessToken = req?.body?.reqHeaders?.cookie.split('=')[1];
        const user = await this.authService.validateJwtPayload(payload);
        if (!user) {
            throw new UnauthorizedException();
        }
        return user;
    }
}