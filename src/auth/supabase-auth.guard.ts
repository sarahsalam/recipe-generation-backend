import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { SupabaseService } from './supabase.service';

type RequestWithUser = Request & {
  userId?: string;
  userEmail?: string | null;
  userName?: string | null;
};

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException(
        'Authorization header must be in format: Bearer <token>',
      );
    }

    const user = await this.supabaseService.getUser(token);
    request.userId = user.id;
    request.userEmail = user.email ?? null;
    request.userName =
      (typeof user.user_metadata?.name === 'string' && user.user_metadata.name.trim()) ||
      (typeof user.user_metadata?.full_name === 'string' &&
        user.user_metadata.full_name.trim()) ||
      null;

    return true;
  }
}
