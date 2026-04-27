import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserData,
} from '../auth/decorators/current-user.decorator';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { MenuCategory } from 'generated/prisma/client';

@ApiTags('Menu')
@ApiBearerAuth('JWT')
@Controller('menu')
@UseGuards(JwtAuthGuard)
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get('items')
  @ApiOperation({
    summary: 'Listar itens do cardápio',
    description:
      'Retorna todos os itens do cardápio do restaurante do usuário autenticado. Use o query param `category` para filtrar por categoria.',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: MenuCategory,
    description: 'Filtrar por categoria do item',
  })
  @ApiOkResponse({ description: 'Lista de itens do cardápio' })
  @ApiUnauthorizedResponse({ description: 'Token inválido ou ausente' })
  async listItems(
    @CurrentUser() user: CurrentUserData,
    @Query('category') category?: MenuCategory,
  ) {
    return this.menuService.listMyMenuItems(user.id, category);
  }

  @Post('items')
  @ApiOperation({
    summary: 'Criar item no cardápio',
    description: 'Adiciona um novo item ao cardápio do restaurante.',
  })
  @ApiCreatedResponse({ description: 'Item criado com sucesso' })
  @ApiUnauthorizedResponse({ description: 'Token inválido ou ausente' })
  @ApiForbiddenResponse({ description: 'Sem permissão para criar itens' })
  async createItem(
    @Body() createMenuItemDto: CreateMenuItemDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.menuService.createMenuItem(createMenuItemDto, user.id);
  }

  @Get('items/:id')
  @ApiOperation({
    summary: 'Buscar item do cardápio por ID',
    description: 'Retorna os dados de um item específico do cardápio.',
  })
  @ApiParam({ name: 'id', description: 'UUID do item do cardápio' })
  @ApiOkResponse({ description: 'Dados do item' })
  @ApiNotFoundResponse({ description: 'Item não encontrado' })
  @ApiUnauthorizedResponse({ description: 'Token inválido ou ausente' })
  async getItem(
    @Param('id') itemId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.menuService.getMenuItemById(itemId, user.id);
  }

  @Patch('items/:id')
  @ApiOperation({
    summary: 'Atualizar item do cardápio',
    description:
      'Atualiza os dados de um item do cardápio. Todos os campos são opcionais.',
  })
  @ApiParam({ name: 'id', description: 'UUID do item do cardápio' })
  @ApiOkResponse({ description: 'Item atualizado com sucesso' })
  @ApiNotFoundResponse({ description: 'Item não encontrado' })
  @ApiUnauthorizedResponse({ description: 'Token inválido ou ausente' })
  async updateItem(
    @Param('id') itemId: string,
    @Body() updateMenuItemDto: UpdateMenuItemDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.menuService.updateMenuItem(itemId, updateMenuItemDto, user.id);
  }

  @Delete('items/:id')
  @ApiOperation({
    summary: 'Remover item do cardápio',
    description: 'Remove permanentemente um item do cardápio pelo ID.',
  })
  @ApiParam({ name: 'id', description: 'UUID do item do cardápio' })
  @ApiNoContentResponse({ description: 'Item removido com sucesso' })
  @ApiNotFoundResponse({ description: 'Item não encontrado' })
  @ApiUnauthorizedResponse({ description: 'Token inválido ou ausente' })
  async removeItem(
    @Param('id') itemId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.menuService.deleteMenuItem(itemId, user.id);
  }
}
