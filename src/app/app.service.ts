import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';

export interface HealthStatus {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  version: string;
  database: {
    status: 'connected' | 'disconnected';
    latencyMs?: number;
    error?: string;
  };
  environment: string;
}

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  async getHealth(): Promise<HealthStatus> {
    const start = Date.now();
    let dbStatus: HealthStatus['database'];

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = {
        status: 'connected',
        latencyMs: Date.now() - start,
      };
    } catch (error: any) {
      dbStatus = {
        status: 'disconnected',
        error: error?.message ?? 'Erro desconhecido ao conectar ao banco',
      };
    }

    return {
      status: dbStatus.status === 'connected' ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: process.env.npm_package_version ?? '1.0.0',
      database: dbStatus,
      environment: process.env.NODE_ENV ?? 'development',
    };
  }
}
