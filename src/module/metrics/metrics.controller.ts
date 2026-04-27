import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { MetricsService } from './metrics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from 'generated/prisma/client';

@ApiTags('Metrics')
@ApiBearerAuth('JWT')
@Controller('metrics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get('users-list')
  @ApiOperation({
    summary: 'Listar usuários para seleção',
    description:
      'Retorna uma lista simplificada de usuários (id + nome) para uso em selects de filtro nas métricas. **Apenas ADMIN.**',
  })
  @ApiOkResponse({
    description: 'Lista de usuários disponíveis',
    schema: {
      example: [
        { id: '550e8400-e29b-41d4-a716-446655440000', name: 'João Silva' },
      ],
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token inválido ou ausente' })
  @ApiForbiddenResponse({ description: 'Acesso restrito a ADMIN' })
  async getUsersList() {
    return this.metricsService.getUsersList();
  }

  @Get('user/:userId')
  @ApiOperation({
    summary: 'Métricas de um restaurante por usuário',
    description:
      'Retorna métricas detalhadas do restaurante vinculado a um usuário: faturamento, comandas, ticket médio, itens mais vendidos, etc. **Apenas ADMIN.**',
  })
  @ApiParam({ name: 'userId', description: 'UUID do usuário (MANAGER) do restaurante' })
  @ApiOkResponse({
    description: 'Métricas do restaurante',
    schema: {
      example: {
        restaurant: { id: '...', name: 'Cantina Central' },
        totalRevenue: 15400.0,
        totalTabs: 312,
        averageTicket: 49.36,
        topItems: [{ name: 'Frango Grelhado', quantity: 87 }],
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Usuário ou restaurante não encontrado' })
  @ApiUnauthorizedResponse({ description: 'Token inválido ou ausente' })
  @ApiForbiddenResponse({ description: 'Acesso restrito a ADMIN' })
  async getUserMetrics(@Param('userId') userId: string) {
    return this.metricsService.getUserMetrics(userId);
  }
}
