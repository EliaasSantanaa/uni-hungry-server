import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { RestaurantsService } from './restaurants.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentUserData } from '../auth/decorators/current-user.decorator';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';

@ApiTags('Restaurants')
@ApiBearerAuth('JWT')
@Controller('restaurants')
@UseGuards(JwtAuthGuard)
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Buscar meu restaurante',
    description: 'Retorna o restaurante vinculado ao usuário autenticado.',
  })
  @ApiOkResponse({ description: 'Dados do restaurante do usuário' })
  @ApiUnauthorizedResponse({ description: 'Token inválido ou ausente' })
  @ApiNotFoundResponse({ description: 'Restaurante não encontrado' })
  async getMyRestaurant(@CurrentUser() user: CurrentUserData) {
    return this.restaurantsService.getUserRestaurant(user.id);
  }

  @Get('me/stats')
  @ApiOperation({
    summary: 'Estatísticas do meu restaurante',
    description:
      'Retorna métricas resumidas do restaurante: total de mesas, comandas abertas, faturamento do dia, etc.',
  })
  @ApiOkResponse({ description: 'Estatísticas do restaurante' })
  @ApiUnauthorizedResponse({ description: 'Token inválido ou ausente' })
  async getMyRestaurantStats(@CurrentUser() user: CurrentUserData) {
    return this.restaurantsService.getRestaurantStats(user.id);
  }

  @Post()
  @ApiOperation({
    summary: 'Criar restaurante',
    description:
      'Cria um novo restaurante e o vincula ao usuário autenticado (MANAGER). Cada MANAGER pode ter apenas um restaurante.',
  })
  @ApiCreatedResponse({ description: 'Restaurante criado com sucesso' })
  @ApiUnauthorizedResponse({ description: 'Token inválido ou ausente' })
  @ApiForbiddenResponse({ description: 'Sem permissão para criar restaurante' })
  async create(
    @Body() createRestaurantDto: CreateRestaurantDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.restaurantsService.create(createRestaurantDto, user.id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar restaurante por ID',
    description: 'Retorna os dados de um restaurante específico.',
  })
  @ApiParam({ name: 'id', description: 'UUID do restaurante' })
  @ApiOkResponse({ description: 'Dados do restaurante' })
  @ApiNotFoundResponse({ description: 'Restaurante não encontrado' })
  async findOne(@Param('id') id: string) {
    return this.restaurantsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar restaurante',
    description:
      'Atualiza os dados de um restaurante. Apenas o proprietário (MANAGER) pode editar o próprio restaurante.',
  })
  @ApiParam({ name: 'id', description: 'UUID do restaurante' })
  @ApiOkResponse({ description: 'Restaurante atualizado com sucesso' })
  @ApiUnauthorizedResponse({ description: 'Token inválido ou ausente' })
  @ApiForbiddenResponse({ description: 'Sem permissão para editar este restaurante' })
  @ApiNotFoundResponse({ description: 'Restaurante não encontrado' })
  async update(
    @Param('id') id: string,
    @Body() updateRestaurantDto: UpdateRestaurantDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.restaurantsService.update(id, updateRestaurantDto, user.id);
  }
}
