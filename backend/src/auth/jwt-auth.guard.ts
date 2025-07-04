import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

// This guard uses the 'jwt' strategy defined in jwt.strategy.ts
// It ensures that the request includes a valid JWT in the Authorization header
// Use with @UseGuards(JwtAuthGuard) to protect routes
