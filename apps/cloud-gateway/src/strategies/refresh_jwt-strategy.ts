// import { Injectable, UnauthorizedException } from "@nestjs/common";
// import { PassportStrategy } from "@nestjs/passport";
// import { ExtractJwt, Strategy } from "passport-jwt";
// import { ConfigService } from "@nestjs/config";
// import { ServiceRegistryService } from "../service-refistry.service";


// @Injectable()
// export class RefreshTokenJwtStrategy extends PassportStrategy(
//     Strategy,
//     "jwt-refresh"
// ) {
//     constructor(
//         private readonly configService: ConfigService,
//         private readonly serviceRegistry: ServiceRegistryService
//     ) {
//         super({
//             jwtFromRequest: ExtractJwt.fromExtractors([
//                 (request: any) => {
//                     const serviceName = request.params.serviceName;
//                     const path = '/' + request.params[0];

//                     const service = this.serviceRegistry.getService(serviceName);
//                     if (service && service.openRoutes.includes(path)) {
//                         return null;
//                     }
//                     return request?.cookies?.refresh_token || null;
//                 },
//             ]),
//             secretOrKey: configService.get('JWT_REFRESH_TOKEN_SECRET'),
//             passReqToCallback: true,
//         });
//     }
//     async validate(req: any, payload: any) {

//         if (!payload) {
//             return null;
//         }

//     }
// }


import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ServiceRegistryService } from '../service-refistry.service';
import { Reflector } from '@nestjs/core';


@Injectable()
export class RefreshTokenJwtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    constructor(
        private readonly configService: ConfigService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (request: any) => request?.cookies?.refresh_token || null,
            ]),
            secretOrKey: configService.get('JWT_REFRESH_TOKEN_SECRET'),
            passReqToCallback: true,
        });
    }

    async validate(req: any, payload: any) {
        if (!payload) {
            throw new UnauthorizedException();
        }
        req.user = payload
        return { user: payload };
    }
}



@Injectable()
export class DynamicRouteGuard extends (AuthGuard('jwt-refresh') as any) {
    constructor(
        private readonly reflector: Reflector,
        private readonly serviceRegistry: ServiceRegistryService,
    ) {
        super();
    }

    canActivate(context: ExecutionContext): boolean | Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const serviceName = request.params.serviceName;
        const path = '/' + request.params[0];

        const service = this.serviceRegistry.getService(serviceName);
        if (service && service.openRoutes.includes(path)) {
            return true; // Bypass authentication for open routes
        }

        // For protected routes, use the Passport strategy
        return super.canActivate(context);
    }
}