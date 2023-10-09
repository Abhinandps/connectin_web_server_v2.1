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
                    
                    let data = request?.cookies["refresh_token"];
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
        const refreshToken = req?.cookies["refresh_token"];

        const user = await this.authService.validateJwtPayload(payload);
        if (!user) {
            throw new UnauthorizedException();
        }
        return { ...user, refresh_token: refreshToken };
    }
}