import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { TabStatus, UserRole } from 'generated/prisma/client';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Estatísticas gerais do sistema (ADMIN)' })
  @ApiOkResponse({ description: 'Estatísticas gerais + operações' })
  @ApiUnauthorizedResponse({ description: 'Token inválido ou ausente' })
  @ApiForbiddenResponse({ description: 'Acesso restrito a ADMIN' })
  async getStats() {
    return this.dashboardService.getStats();
  }

  @Get('restaurants')
  @ApiOperation({ summary: 'Lista de restaurantes com métricas (ADMIN)' })
  async getRestaurants() {
    return this.dashboardService.getRestaurantsOverview();
  }

  @Get('restaurants/:id')
  @ApiOperation({ summary: 'Detalhe do restaurante (ADMIN)' })
  async getRestaurantById(@Param('id') id: string) {
    return this.dashboardService.getRestaurantById(id);
  }

  @Get('menu-items')
  @ApiOperation({ summary: 'Lista global de itens do cardápio (ADMIN)' })
  @ApiQuery({ name: 'restaurantId', required: false })
  async getMenuItems(@Query('restaurantId') restaurantId?: string) {
    return this.dashboardService.getMenuItems(restaurantId);
  }

  @Get('tables')
  @ApiOperation({ summary: 'Lista global de mesas (ADMIN)' })
  @ApiQuery({ name: 'restaurantId', required: false })
  async getTables(@Query('restaurantId') restaurantId?: string) {
    return this.dashboardService.getTables(restaurantId);
  }

  @Get('tabs')
  @ApiOperation({ summary: 'Lista de comandas (ADMIN)' })
  @ApiQuery({ name: 'restaurantId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: TabStatus })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTabs(
    @Query('restaurantId') restaurantId?: string,
    @Query('status') status?: TabStatus,
    @Query('limit') limit?: string,
  ) {
    return this.dashboardService.getTabs({
      restaurantId,
      status,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('tabs/:id')
  @ApiOperation({ summary: 'Detalhe da comanda (ADMIN)' })
  async getTabById(@Param('id') id: string) {
    return this.dashboardService.getTabById(id);
  }
}
