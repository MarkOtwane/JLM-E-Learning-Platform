import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      datasources: {
        db: {
          // Prefer connection pool URL if available (PgBouncer, etc.)
          url: process.env.DATABASE_URL_POOL || process.env.DATABASE_URL,
        },
      },
      // Only log errors in production, more in development
      log:
        process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
