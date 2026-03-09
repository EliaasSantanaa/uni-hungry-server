import {
  Controller,
  Get,
  Param,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from 'generated/prisma/client';

@Controller('metrics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN) // Apenas ADMIN pode acessar métricas
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  // Buscar métricas de um usuário específico
  @Get('user/:userId')
  async getUserMetrics(@Param('userId') userId: string) {
    return this.metricsService.getUserMetrics(userId);
  }

  // Buscar lista de usuários para o select
  @Get('users-list')
  async getUsersList() {
    return this.metricsService.getUsersList();
  }
}
