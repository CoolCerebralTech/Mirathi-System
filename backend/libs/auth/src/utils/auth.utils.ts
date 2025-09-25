import { Request } from 'express';

export function extractTokenFromHeader(request: Request): string | undefined {
  const [type, token] = request.headers.authorization?.split(' ') ?? [];
  return type === 'Bearer' ? token : undefined;
}

export function getClientInfo(request: Request): { ip: string; userAgent: string } {
  const ip = request.ip || 
              request.connection.remoteAddress || 
              request.socket.remoteAddress ||
              'unknown';
  
  const userAgent = request.headers['user-agent'] || 'unknown';

  return { ip, userAgent };
}

export function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function calculateTokenExpiration(expiresIn: string): Date {
  const units = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) {
    return new Date(Date.now() + 3600000); // Default 1 hour
  }

  const value = parseInt(match[1]);
  const unit = match[2] as keyof typeof units;

  return new Date(Date.now() + value * units[unit]);
}