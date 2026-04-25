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
import { MenuService } from './menu.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserData,
} from '../auth/decorators/current-user.decorator';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { MenuCategory } from 'generated/prisma/client';

@Controller('menu')
@UseGuards(JwtAuthGuard)
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get('items')
  async listItems(
    @CurrentUser() user: CurrentUserData,
    @Query('category') category?: MenuCategory,
  ) {
    return this.menuService.listMyMenuItems(user.id, category);
  }

  @Post('items')
  async createItem(
    @Body() createMenuItemDto: CreateMenuItemDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.menuService.createMenuItem(createMenuItemDto, user.id);
  }

  @Get('items/:id')
  async getItem(
    @Param('id') itemId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.menuService.getMenuItemById(itemId, user.id);
  }

  @Patch('items/:id')
  async updateItem(
    @Param('id') itemId: string,
    @Body() updateMenuItemDto: UpdateMenuItemDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.menuService.updateMenuItem(itemId, updateMenuItemDto, user.id);
  }

  @Delete('items/:id')
  async removeItem(
    @Param('id') itemId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.menuService.deleteMenuItem(itemId, user.id);
  }
}
