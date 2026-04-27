import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from 'generated/prisma/client';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({
    summary: 'Estatísticas gerais do sistema',
    description:
      'Retorna um resumo geral: total de usuários, restaurantes ativos, comandas abertas e faturamento global. **Apenas ADMIN.**',
  })
  @ApiOkResponse({
    description: 'Estatísticas gerais',
    schema: {
      example: {
        totalUsers: 42,
        totalRestaurants: 8,
        openTabs: 15,
        revenueToday: 3280.5,
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token inválido ou ausente' })
  @ApiForbiddenResponse({ description: 'Acesso restrito a ADMIN' })
  async getStats() {
    return this.dashboardService.getStats();
  }

  @Get('restaurants')
  @ApiOperation({
    summary: 'Visão geral de todos os restaurantes',
    description:
      'Lista todos os restaurantes com seus respectivos dados de atividade (mesas, comandas abertas, funcionários). **Apenas ADMIN.**',
  })
  @ApiOkResponse({ description: 'Lista de restaurantes com métricas resumidas' })
  @ApiUnauthorizedResponse({ description: 'Token inválido ou ausente' })
  @ApiForbiddenResponse({ description: 'Acesso restrito a ADMIN' })
  async getRestaurants() {
    return this.dashboardService.getRestaurantsOverview();
  }
}
