import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AccessTokenJwtStrategy extends PassportStrategy(Strategy, "jwt") {
    constructor(
        private readonly configService: ConfigService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (request: any) => {
                    let _aToken = request.cookies.access_token;

                    if (!_aToken) {
                        return null;
                    }
                    return _aToken;
                },
            ]),
            secretOrKey: configService.get('JWT_ACCESS_TOKEN_SECRET'),
        });
    }
    async validate(req: any, payload: any) {
        console.log(payload, "payload");

        // let accessToken = req?.body?.reqHeaders?.cookie.split('=')[1];
        const user = payload;
        if (!user) {
            throw new UnauthorizedException();
        }
        return user;
    }
}