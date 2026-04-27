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
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
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

@ApiTags('Tabs')
@ApiBearerAuth('JWT')
@Controller('tabs')
@UseGuards(JwtAuthGuard)
export class TabsController {
  constructor(private readonly tabsService: TabsService) {}

  // ── Histórico ─────────────────────────────────────────────────────────────

  @Get('history')
  @ApiOperation({
    summary: 'Histórico de comandas por data',
    description:
      'Retorna todas as comandas fechadas ou canceladas em uma data específica. Use o formato `YYYY-MM-DD` e o offset de fuso horário em minutos.',
  })
  @ApiQuery({
    name: 'date',
    required: true,
    description: 'Data no formato YYYY-MM-DD',
    example: '2025-04-26',
  })
  @ApiQuery({
    name: 'tz',
    required: false,
    description: 'Offset do fuso horário em minutos (ex: `-180` para UTC-3)',
    example: '-180',
  })
  @ApiOkResponse({ description: 'Histórico de comandas da data informada' })
  @ApiUnauthorizedResponse({ description: 'Token inválido ou ausente' })
  async getTabHistory(
    @Query('date') date: string,
    @Query('tz') tz: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const tzOffset = parseInt(tz ?? '0', 10);
    return this.tabsService.getTabHistory(user.id, date, tzOffset);
  }

  // ── Mesas ─────────────────────────────────────────────────────────────────

  @Get('tables')
  @ApiOperation({
    summary: 'Listar mesas',
    description: 'Retorna todas as mesas do restaurante do usuário autenticado.',
  })
  @ApiOkResponse({ description: 'Lista de mesas' })
  @ApiUnauthorizedResponse({ description: 'Token inválido ou ausente' })
  async listTables(@CurrentUser() user: CurrentUserData) {
    return this.tabsService.listTables(user.id);
  }

  @Post('tables')
  @ApiOperation({
    summary: 'Criar mesa',
    description: 'Adiciona uma nova mesa ao restaurante.',
  })
  @ApiCreatedResponse({ description: 'Mesa criada com sucesso' })
  @ApiUnauthorizedResponse({ description: 'Token inválido ou ausente' })
  async createTable(
    @Body() dto: CreateTableDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.tabsService.createTable(dto, user.id);
  }

  @Patch('tables/:id')
  @ApiOperation({
    summary: 'Atualizar mesa',
    description:
      'Atualiza os dados de uma mesa (nome, número, capacidade ou status).',
  })
  @ApiParam({ name: 'id', description: 'UUID da mesa' })
  @ApiOkResponse({ description: 'Mesa atualizada com sucesso' })
  @ApiNotFoundResponse({ description: 'Mesa não encontrada' })
  @ApiUnauthorizedResponse({ description: 'Token inválido ou ausente' })
  async updateTable(
    @Param('id') tableId: string,
    @Body() dto: UpdateTableDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.tabsService.updateTable(tableId, dto, user.id);
  }

  @Delete('tables/:id')
  @ApiOperation({
    summary: 'Deletar mesa',
    description:
      'Remove uma mesa do restaurante. Mesas com comandas abertas não podem ser deletadas.',
  })
  @ApiParam({ name: 'id', description: 'UUID da mesa' })
  @ApiNoContentResponse({ description: 'Mesa removida com sucesso' })
  @ApiNotFoundResponse({ description: 'Mesa não encontrada' })
  @ApiUnauthorizedResponse({ description: 'Token inválido ou ausente' })
  async deleteTable(
    @Param('id') tableId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.tabsService.deleteTable(tableId, user.id);
  }

  @Get('tables/:tableId/tab')
  @ApiOperation({
    summary: 'Buscar comanda ativa da mesa',
    description:
      'Retorna a comanda aberta (status OPEN) para a mesa informada, incluindo todos os itens pedidos.',
  })
  @ApiParam({ name: 'tableId', description: 'UUID da mesa' })
  @ApiOkResponse({ description: 'Comanda ativa da mesa' })
  @ApiNotFoundResponse({ description: 'Mesa ou comanda não encontrada' })
  @ApiUnauthorizedResponse({ description: 'Token inválido ou ausente' })
  async getActiveTabForTable(
    @Param('tableId') tableId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.tabsService.getActiveTabForTable(tableId, user.id);
  }

  @Post('tables/:tableId/tab')
  @ApiOperation({
    summary: 'Abrir comanda na mesa',
    description:
      'Cria uma nova comanda (status OPEN) para a mesa. A mesa não pode ter outra comanda aberta.',
  })
  @ApiParam({ name: 'tableId', description: 'UUID da mesa' })
  @ApiCreatedResponse({ description: 'Comanda aberta com sucesso' })
  @ApiNotFoundResponse({ description: 'Mesa não encontrada' })
  @ApiUnauthorizedResponse({ description: 'Token inválido ou ausente' })
  async openTab(
    @Param('tableId') tableId: string,
    @Body() dto: OpenTabDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.tabsService.openTab(tableId, dto, user.id);
  }

  // ── Comandas ──────────────────────────────────────────────────────────────

  @Get(':tabId')
  @ApiOperation({
    summary: 'Buscar comanda por ID',
    description:
      'Retorna os dados de uma comanda pelo ID, incluindo itens e total calculado.',
  })
  @ApiParam({ name: 'tabId', description: 'UUID da comanda' })
  @ApiOkResponse({ description: 'Dados da comanda' })
  @ApiNotFoundResponse({ description: 'Comanda não encontrada' })
  @ApiUnauthorizedResponse({ description: 'Token inválido ou ausente' })
  async getTabById(
    @Param('tabId') tabId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.tabsService.getTabById(tabId, user.id);
  }

  @Post(':tabId/items')
  @ApiOperation({
    summary: 'Adicionar item à comanda',
    description:
      'Adiciona um item do cardápio à comanda aberta. Informe `menuItemId`, `quantity` e `note` opcionalmente.',
  })
  @ApiParam({ name: 'tabId', description: 'UUID da comanda' })
  @ApiCreatedResponse({ description: 'Item adicionado à comanda' })
  @ApiNotFoundResponse({ description: 'Comanda ou item do cardápio não encontrado' })
  @ApiUnauthorizedResponse({ description: 'Token inválido ou ausente' })
  async addItemToTab(
    @Param('tabId') tabId: string,
    @Body() dto: AddTabItemDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.tabsService.addItemToTab(tabId, dto, user.id);
  }

  @Delete(':tabId/items/:itemId')
  @ApiOperation({
    summary: 'Remover item da comanda',
    description: 'Remove um item da comanda aberta pelo ID do item.',
  })
  @ApiParam({ name: 'tabId', description: 'UUID da comanda' })
  @ApiParam({ name: 'itemId', description: 'UUID do item dentro da comanda' })
  @ApiNoContentResponse({ description: 'Item removido com sucesso' })
  @ApiNotFoundResponse({ description: 'Comanda ou item não encontrado' })
  @ApiUnauthorizedResponse({ description: 'Token inválido ou ausente' })
  async removeItemFromTab(
    @Param('tabId') tabId: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.tabsService.removeItemFromTab(tabId, itemId, user.id);
  }

  @Patch(':tabId/close')
  @ApiOperation({
    summary: 'Fechar comanda (pagamento)',
    description:
      'Encerra a comanda com pagamento. Informe a forma de pagamento e se deve aplicar taxa de serviço (10%).',
  })
  @ApiParam({ name: 'tabId', description: 'UUID da comanda' })
  @ApiOkResponse({ description: 'Comanda fechada com sucesso' })
  @ApiNotFoundResponse({ description: 'Comanda não encontrada' })
  @ApiUnauthorizedResponse({ description: 'Token inválido ou ausente' })
  async closeTab(
    @Param('tabId') tabId: string,
    @Body() dto: CloseTabDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.tabsService.closeTab(tabId, dto, user.id);
  }

  @Patch(':tabId/cancel')
  @ApiOperation({
    summary: 'Cancelar comanda',
    description:
      'Cancela uma comanda aberta sem gerar cobrança. A mesa fica disponível novamente.',
  })
  @ApiParam({ name: 'tabId', description: 'UUID da comanda' })
  @ApiOkResponse({ description: 'Comanda cancelada com sucesso' })
  @ApiNotFoundResponse({ description: 'Comanda não encontrada' })
  @ApiUnauthorizedResponse({ description: 'Token inválido ou ausente' })
  async cancelTab(
    @Param('tabId') tabId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.tabsService.cancelTab(tabId, user.id);
  }
}
