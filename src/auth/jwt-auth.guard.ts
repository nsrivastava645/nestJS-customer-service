import { Cache } from '@nestjs/cache-manager';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly cacheManager: Cache,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid authorization header',
      );
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = await this.jwtService.verify(token);
      // Access custom metadata for roles
      const roles = this.reflector.get<string[]>('roles', context.getHandler());
      if (roles && !roles.some((role) => role == decoded.role)) {
        throw new UnauthorizedException('Insufficient privileges');
      }

      const userId = decoded.sub;

      const cachedToken = await this.cacheManager.get(`accessToken:${userId}`);
      if (!cachedToken || cachedToken !== token) {
        throw new UnauthorizedException('Invalid token');
      }

      request.userId = userId;
      return true;
    } catch (error) {
      throw new UnauthorizedException(error.message || 'Invalid Token');
    }
  }
}
