import { SecurityService } from './service';
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
export declare class JwtGuard implements CanActivate {
    private readonly jwtService;
    private readonly securityService;
    private reflector;
    private readonly logger;
    constructor(jwtService: JwtService, securityService: SecurityService, reflector: Reflector);
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean>;
    private validateToken;
}
