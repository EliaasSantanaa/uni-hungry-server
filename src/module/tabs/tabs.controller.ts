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
import { TabsService } from './tabs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserData,
} from '../auth/decorators/current-user.decorator';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { OpenTabDto } from './dto/open-tab.dto';
import { AddTabItemDto } from './dto/add-tab-item.dto';
import { CloseTabDto } from './dto/close-tab.dto';

@Controller('tabs')
@UseGuards(JwtAuthGuard)
export class TabsController {
  constructor(private readonly tabsService: TabsService) {}

  // ── TABLES ──────────────────────────────────────────────────────────────────

  @Get('history')
  async getTabHistory(
    @Query('date') date: string,
    @Query('tz') tz: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const tzOffset = parseInt(tz ?? '0', 10);
    return this.tabsService.getTabHistory(user.id, date, tzOffset);
  }

  @Get('tables')
  async listTables(@CurrentUser() user: CurrentUserData) {
    return this.tabsService.listTables(user.id);
  }

  @Post('tables')
  async createTable(
    @Body() dto: CreateTableDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.tabsService.createTable(dto, user.id);
  }

  @Patch('tables/:id')
  async updateTable(
    @Param('id') tableId: string,
    @Body() dto: UpdateTableDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.tabsService.updateTable(tableId, dto, user.id);
  }

  @Delete('tables/:id')
  async deleteTable(
    @Param('id') tableId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.tabsService.deleteTable(tableId, user.id);
  }

  @Get('tables/:tableId/tab')
  async getActiveTabForTable(
    @Param('tableId') tableId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.tabsService.getActiveTabForTable(tableId, user.id);
  }

  @Post('tables/:tableId/tab')
  async openTab(
    @Param('tableId') tableId: string,
    @Body() dto: OpenTabDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.tabsService.openTab(tableId, dto, user.id);
  }

  // ── TABS ─────────────────────────────────────────────────────────────────────

  @Get(':tabId')
  async getTabById(
    @Param('tabId') tabId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.tabsService.getTabById(tabId, user.id);
  }

  @Post(':tabId/items')
  async addItemToTab(
    @Param('tabId') tabId: string,
    @Body() dto: AddTabItemDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.tabsService.addItemToTab(tabId, dto, user.id);
  }

  @Delete(':tabId/items/:itemId')
  async removeItemFromTab(
    @Param('tabId') tabId: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.tabsService.removeItemFromTab(tabId, itemId, user.id);
  }

  @Patch(':tabId/close')
  async closeTab(
    @Param('tabId') tabId: string,
    @Body() dto: CloseTabDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.tabsService.closeTab(tabId, dto, user.id);
  }

  @Patch(':tabId/cancel')
  async cancelTab(
    @Param('tabId') tabId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.tabsService.cancelTab(tabId, user.id);
  }
}
