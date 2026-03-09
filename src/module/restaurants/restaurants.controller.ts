import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentUserData } from '../auth/decorators/current-user.decorator';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';

@Controller('restaurants')
@UseGuards(JwtAuthGuard)
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  // Buscar restaurante do usuário logado
  @Get('me')
  async getMyRestaurant(@CurrentUser() user: CurrentUserData) {
    return this.restaurantsService.getUserRestaurant(user.id);
  }

  // Buscar estatísticas do restaurante do usuário
  @Get('me/stats')
  async getMyRestaurantStats(@CurrentUser() user: CurrentUserData) {
    return this.restaurantsService.getRestaurantStats(user.id);
  }

  // Criar restaurante (MANAGER pode criar o seu)
  @Post()
  async create(
    @Body() createRestaurantDto: CreateRestaurantDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.restaurantsService.create(createRestaurantDto, user.id);
  }

  // Buscar restaurante por ID
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.restaurantsService.findOne(id);
  }

  // Atualizar restaurante
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateRestaurantDto: UpdateRestaurantDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.restaurantsService.update(id, updateRestaurantDto, user.id);
  }
}
