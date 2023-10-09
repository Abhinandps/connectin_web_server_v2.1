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
                    let data = request?.cookies["access_token"];
                    if (!data) {
                        return null;
                    }
                    return data;
                },
            ]),
            secretOrKey: configService.get('JWT_ACCESS_TOKEN_SECRET'),
            passReqToCallback: true,
        });
    }
    async validate(req: any, payload: any) {
        const accessToken = req?.cookies["access_token"];
        const user = await this.authService.validateJwtPayload(payload);
        if (!user) {
            throw new UnauthorizedException();
        }
        return {user,accessToken};
    }
}