// import {
//     CanActivate,
//     ExecutionContext,
//     Inject,
//     Injectable,
//     UnauthorizedException,
// } from '@nestjs/common';
// import { ClientProxy } from '@nestjs/microservices';
// import { catchError, Observable, tap } from 'rxjs';
// import { AUTH_SERVICE } from './services';

// @Injectable()
// export class JwtAuthGuard implements CanActivate {
//     constructor(@Inject(AUTH_SERVICE) private authClient: ClientProxy) { }

//     canActivate(
//         context: ExecutionContext,
//     ): boolean | Promise<boolean> | Observable<boolean> {
//         const authentication = this.getAuthentication(context);
//         return this.authClient
//             .send('validate_user', {
//                 Authentication: authentication,
//             })
//             .pipe(
//                 tap((res) => {
//                     this.addUser(res, context);
//                 }),
//                 catchError(() => {
//                     throw new UnauthorizedException();
//                 }),
//             );
//     }

//     private getAuthentication(context: ExecutionContext) {
//         let authentication: string;
//         if (context.getType() === 'rpc') {
//             authentication = context.switchToRpc().getData().Authentication;
//         } else if (context.getType() === 'http') {
//             authentication = context.switchToHttp().getRequest()
//                 .cookies?.Authentication;
//         }
//         if (!authentication) {
//             throw new UnauthorizedException(
//                 'No value was provided for Authentication',
//             );
//         }
//         return authentication;
//     }

//     private addUser(user: any, context: ExecutionContext) {
//         if (context.getType() === 'rpc') {
//             context.switchToRpc().getData().user = user;
//         } else if (context.getType() === 'http') {
//             context.switchToHttp().getRequest().user = user;
//         }
//     }


// }




import {
    CanActivate,
    ExecutionContext,
    Inject,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { catchError, Observable, tap } from 'rxjs';
import { AUTH_SERVICE } from './services';


@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(
        @Inject(AUTH_SERVICE) private authClient: ClientKafka,
    ) { }

    async canActivate(
        context: ExecutionContext,
    ): Promise<any>
    // boolean | Promise<boolean> | Observable<boolean>
    {
        const authentication = this.getAuthentication(context);

        this.authClient.subscribeToResponseOf('validate_user');

        const response = await this.authClient.send('validate_user', {
            Authentication: authentication,
        }).toPromise();

        if (response) {
            // If the response is valid, you can handle it, e.g., set user data in the request
            this.addUser(response, context);
            return true; // Continue with the request
        } else {
            throw new UnauthorizedException();
        }

        // return this.authClient
        //     .emit('validate_user', {
        //         Authentication: authentication,
        //     })
        //     .pipe(
        //         tap((res) => {
        //             this.addUser(res, context);
        //         }),
        //         catchError(() => {
        //             throw new UnauthorizedException();
        //         }),
        //     )
    }

    private getAuthentication(context: ExecutionContext) {
        let authentication: string;
        if (context.getType() === 'rpc') {
            authentication = context.switchToRpc().getData().Authentication;
        } else if (context.getType() === 'http') {

            const cookies = this.getCookies(context.switchToHttp().getRequest().body.reqHeaders);
            if (cookies && cookies.refresh_token) {
                authentication = cookies?.refresh_token
            }
        }
        if (!authentication) {
            throw new UnauthorizedException(
                'No value was provided for Authentication',
            );
        }
        return authentication;
    }

    private getCookies(request: any): any {

        if (request.cookie) {
            const cookies = request.cookie.split('; ');

            const cookieMap = {};

            for (const cookie of cookies) {
                const [name, value] = cookie.split('=');
                cookieMap[name] = value;
            }

            return cookieMap;
        } else {
            throw new UnauthorizedException();
        }
    }

    private addUser(user: any, context: ExecutionContext) {
        if (context.getType() === 'rpc') {
            context.switchToRpc().getData().user = user;
        } else if (context.getType() === 'http') {
            context.switchToHttp().getRequest().user = user;
        }
    }

}





// import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
// import { ClientProxy } from '@nestjs/microservices';
// import { catchError, Observable, tap } from 'rxjs';
// import { AUTH_SERVICE } from './services';
// import { RefreshTokenJwtStrategy } from './strategies/refresh_jwt-strategy';


// @Injectable()
// export class JwtAuthGuard implements CanActivate {
//     constructor(
//         @Inject(AUTH_SERVICE) private authClient: ClientProxy,
//         private refreshTokenJwtStrategy: RefreshTokenJwtStrategy,
//     ) { }

//     canActivate(
//         context: ExecutionContext,
//     ): boolean | Promise<boolean> | Observable<boolean> {
//         // If the Authentication token is not present, check for the refresh token.
//         const authentication = context.getArgByIndex(0).req.headers.get('Authentication');
//         const refreshToken = context.getArgByIndex(0).req.cookies?.refreshToken;
//         if (!authentication && refreshToken) {
//             // Validate the refresh token.
//             const user = await this.refreshTokenJwtStrategy.validate(context.getArgByIndex(0).req);

//             // If the refresh token is valid, generate a new access token.
//             const newAuthentication = this.authClient.send('generate_new_access_token', {
//                 user,
//             });

//             // Set the new access token in the request headers.
//             context.getArgByIndex(0).req.headers.set('Authentication', newAuthentication);
//         }

//         return this.authClient
//             .send('validate_user', {
//                 Authentication: authentication,
//             })
//             .pipe(
//                 tap((res) => {
//                     this.addUser(res, context);
//                 }),
//                 catchError(() => {
//                     throw new UnauthorizedException();
//                 }),
//             );
//     }

//     private addUser(user: any, context: ExecutionContext) {
//         if (context.getType() === 'rpc') {
//             context.switchToRpc().getData().user = user;
//         } else if (context.getType() === 'http') {
//             context.switchToHttp().getRequest().user = user;
//         }
//     }
// }

