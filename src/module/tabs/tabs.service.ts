import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import {
  PaymentMethod,
  TabStatus,
  TableStatus,
  UserRole,
} from 'generated/prisma/client';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { OpenTabDto } from './dto/open-tab.dto';
import { AddTabItemDto } from './dto/add-tab-item.dto';
import { CloseTabDto } from './dto/close-tab.dto';

@Injectable()
export class TabsService {
  constructor(private readonly db: PrismaService) {}

  private async getCurrentUserWithRestaurant(userId: string) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, isActive: true, restaurantId: true },
    });

    if (!user) throw new NotFoundException('Usuario nao encontrado');
    if (!user.isActive) throw new ForbiddenException('Usuario inativo');
    if (user.role === UserRole.ADMIN)
      throw new ForbiddenException('Administrador nao possui restaurante vinculado');
    if (!user.restaurantId)
      throw new ForbiddenException('Voce precisa de um restaurante vinculado');

    return { id: user.id, role: user.role, restaurantId: user.restaurantId };
  }

  private toTableResponse(table: {
    id: string;
    number: number | null;
    name: string | null;
    capacity: number | null;
    status: TableStatus;
    restaurantId: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: table.id,
      number: table.number,
      name: table.name,
      capacity: table.capacity,
      status: table.status,
      restaurantId: table.restaurantId,
      createdAt: table.createdAt,
      updatedAt: table.updatedAt,
    };
  }

  private toTabItemResponse(item: {
    id: string;
    tabId: string;
    menuItemId: string;
    quantity: number;
    unitPrice: { toString(): string };
    note: string | null;
    createdAt: Date;
    menuItem?: { name: string; category: string } | null;
  }) {
    return {
      id: item.id,
      tabId: item.tabId,
      menuItemId: item.menuItemId,
      menuItemName: item.menuItem?.name ?? null,
      menuItemCategory: item.menuItem?.category ?? null,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice.toString()),
      subtotal: Number(item.unitPrice.toString()) * item.quantity,
      note: item.note,
      createdAt: item.createdAt,
    };
  }

  private toTabResponse(tab: {
    id: string;
    tableId: string;
    status: TabStatus;
    totalAmount: { toString(): string };
    note: string | null;
    openedAt: Date;
    closedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    items?: any[];
  }) {
    return {
      id: tab.id,
      tableId: tab.tableId,
      status: tab.status,
      totalAmount: Number(tab.totalAmount.toString()),
      note: tab.note,
      openedAt: tab.openedAt,
      closedAt: tab.closedAt,
      createdAt: tab.createdAt,
      updatedAt: tab.updatedAt,
      items: (tab.items ?? []).map((i) => this.toTabItemResponse(i)),
    };
  }

  private async recalculateTotal(tabId: string): Promise<number> {
    const items = await this.db.tabItem.findMany({
      where: { tabId },
      select: { quantity: true, unitPrice: true },
    });

    const total = items.reduce(
      (sum, item) => sum + item.quantity * Number(item.unitPrice.toString()),
      0,
    );

    await this.db.tab.update({
      where: { id: tabId },
      data: { totalAmount: total },
    });

    return total;
  }

  // ── TABLES ──────────────────────────────────────────────────────────────────

  async listTables(userId: string) {
    const user = await this.getCurrentUserWithRestaurant(userId);

    const tables = await this.db.table.findMany({
      where: { restaurantId: user.restaurantId },
      orderBy: [{ number: 'asc' }, { name: 'asc' }],
    });

    return {
      success: true,
      total: tables.length,
      tables: tables.map((t) => this.toTableResponse(t)),
    };
  }

  async createTable(dto: CreateTableDto, userId: string) {
    const user = await this.getCurrentUserWithRestaurant(userId);

    if (!dto.number && !dto.name) {
      throw new BadRequestException('Informe o numero ou o nome da mesa');
    }

    const table = await this.db.table.create({
      data: {
        number: dto.number ?? null,
        name: dto.name?.trim() ?? null,
        capacity: dto.capacity ?? null,
        status: TableStatus.AVAILABLE,
        restaurantId: user.restaurantId,
      },
    });

    return {
      success: true,
      message: 'Mesa cadastrada com sucesso',
      table: this.toTableResponse(table),
    };
  }

  async updateTable(tableId: string, dto: UpdateTableDto, userId: string) {
    const user = await this.getCurrentUserWithRestaurant(userId);

    const table = await this.db.table.findFirst({
      where: { id: tableId, restaurantId: user.restaurantId },
    });

    if (!table) throw new NotFoundException('Mesa nao encontrada');

    const data: Record<string, unknown> = {};
    if (dto.number !== undefined) data.number = dto.number;
    if (dto.name !== undefined) data.name = dto.name?.trim() ?? null;
    if (dto.capacity !== undefined) data.capacity = dto.capacity;
    if (dto.status !== undefined) data.status = dto.status;

    if (!Object.keys(data).length)
      throw new BadRequestException('Nenhum campo informado para atualizacao');

    const updated = await this.db.table.update({
      where: { id: tableId },
      data,
    });

    return {
      success: true,
      message: 'Mesa atualizada com sucesso',
      table: this.toTableResponse(updated),
    };
  }

  async deleteTable(tableId: string, userId: string) {
    const user = await this.getCurrentUserWithRestaurant(userId);

    const table = await this.db.table.findFirst({
      where: { id: tableId, restaurantId: user.restaurantId },
    });

    if (!table) throw new NotFoundException('Mesa nao encontrada');

    const hasOpenTab = await this.db.tab.findFirst({
      where: { tableId, status: TabStatus.OPEN },
      select: { id: true },
    });

    if (hasOpenTab)
      throw new BadRequestException(
        'Nao e possivel remover mesa com comanda aberta',
      );

    await this.db.table.delete({ where: { id: tableId } });

    return { success: true, message: 'Mesa removida com sucesso' };
  }

  // ── TABS ─────────────────────────────────────────────────────────────────────

  async getActiveTabForTable(tableId: string, userId: string) {
    const user = await this.getCurrentUserWithRestaurant(userId);

    const table = await this.db.table.findFirst({
      where: { id: tableId, restaurantId: user.restaurantId },
    });

    if (!table) throw new NotFoundException('Mesa nao encontrada');

    const tab = await this.db.tab.findFirst({
      where: { tableId, status: TabStatus.OPEN },
      include: {
        items: {
          include: { menuItem: { select: { name: true, category: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return {
      success: true,
      table: this.toTableResponse(table),
      tab: tab ? this.toTabResponse(tab) : null,
    };
  }

  async openTab(tableId: string, dto: OpenTabDto, userId: string) {
    const user = await this.getCurrentUserWithRestaurant(userId);

    const table = await this.db.table.findFirst({
      where: { id: tableId, restaurantId: user.restaurantId },
    });

    if (!table) throw new NotFoundException('Mesa nao encontrada');

    if (table.status === TableStatus.INACTIVE)
      throw new BadRequestException('Mesa inativa nao pode receber comanda');

    const existing = await this.db.tab.findFirst({
      where: { tableId, status: TabStatus.OPEN },
      select: { id: true },
    });

    if (existing)
      throw new BadRequestException('Mesa ja possui uma comanda aberta');

    const tab = await this.db.tab.create({
      data: {
        tableId,
        note: dto.note?.trim() ?? null,
        status: TabStatus.OPEN,
        totalAmount: 0,
      },
    });

    await this.db.table.update({
      where: { id: tableId },
      data: { status: TableStatus.OCCUPIED },
    });

    return {
      success: true,
      message: 'Comanda aberta com sucesso',
      tab: this.toTabResponse({ ...tab, items: [] }),
    };
  }

  async getTabById(tabId: string, userId: string) {
    const user = await this.getCurrentUserWithRestaurant(userId);

    const tab = await this.db.tab.findFirst({
      where: { id: tabId },
      include: {
        table: true,
        items: {
          include: { menuItem: { select: { name: true, category: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!tab) throw new NotFoundException('Comanda nao encontrada');

    if (tab.table.restaurantId !== user.restaurantId)
      throw new ForbiddenException('Acesso negado a esta comanda');

    return {
      success: true,
      table: this.toTableResponse(tab.table),
      tab: this.toTabResponse(tab),
    };
  }

  async addItemToTab(tabId: string, dto: AddTabItemDto, userId: string) {
    const user = await this.getCurrentUserWithRestaurant(userId);

    const tab = await this.db.tab.findFirst({
      where: { id: tabId },
      include: { table: { select: { restaurantId: true } } },
    });

    if (!tab) throw new NotFoundException('Comanda nao encontrada');
    if (tab.table.restaurantId !== user.restaurantId)
      throw new ForbiddenException('Acesso negado');
    if (tab.status !== TabStatus.OPEN)
      throw new BadRequestException('Comanda nao esta aberta');

    const menuItem = await this.db.menuItem.findFirst({
      where: { id: dto.menuItemId, restaurantId: user.restaurantId },
    });

    if (!menuItem)
      throw new NotFoundException('Item do cardapio nao encontrado');
    if (!menuItem.isAvailable)
      throw new BadRequestException('Item do cardapio nao esta disponivel');

    await this.db.tabItem.create({
      data: {
        tabId,
        menuItemId: dto.menuItemId,
        quantity: dto.quantity ?? 1,
        unitPrice: menuItem.price,
        note: dto.note?.trim() ?? null,
      },
    });

    const newTotal = await this.recalculateTotal(tabId);

    const updatedTab = await this.db.tab.findFirst({
      where: { id: tabId },
      include: {
        items: {
          include: { menuItem: { select: { name: true, category: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return {
      success: true,
      message: 'Item adicionado a comanda',
      totalAmount: newTotal,
      tab: this.toTabResponse(updatedTab!),
    };
  }

  async removeItemFromTab(tabId: string, itemId: string, userId: string) {
    const user = await this.getCurrentUserWithRestaurant(userId);

    const tab = await this.db.tab.findFirst({
      where: { id: tabId },
      include: { table: { select: { restaurantId: true } } },
    });

    if (!tab) throw new NotFoundException('Comanda nao encontrada');
    if (tab.table.restaurantId !== user.restaurantId)
      throw new ForbiddenException('Acesso negado');
    if (tab.status !== TabStatus.OPEN)
      throw new BadRequestException('Comanda nao esta aberta');

    const item = await this.db.tabItem.findFirst({
      where: { id: itemId, tabId },
    });

    if (!item) throw new NotFoundException('Item nao encontrado na comanda');

    await this.db.tabItem.delete({ where: { id: itemId } });

    const newTotal = await this.recalculateTotal(tabId);

    return {
      success: true,
      message: 'Item removido da comanda',
      totalAmount: newTotal,
    };
  }

  async closeTab(tabId: string, dto: CloseTabDto, userId: string) {
    const user = await this.getCurrentUserWithRestaurant(userId);

    const tab = await this.db.tab.findFirst({
      where: { id: tabId },
      include: { table: true },
    });

    if (!tab) throw new NotFoundException('Comanda nao encontrada');
    if (tab.table.restaurantId !== user.restaurantId)
      throw new ForbiddenException('Acesso negado');
    if (tab.status !== TabStatus.OPEN)
      throw new BadRequestException('Comanda nao esta aberta');

    const subtotal = await this.recalculateTotal(tabId);
    const serviceCharge =
      dto.applyServiceCharge !== false
        ? Math.round(subtotal * 0.1 * 100) / 100
        : 0;
    const totalAmount = Math.round((subtotal + serviceCharge) * 100) / 100;

    await this.db.tab.update({
      where: { id: tabId },
      data: {
        status: TabStatus.CLOSED,
        subtotal,
        serviceCharge,
        totalAmount,
        paymentMethod: dto.paymentMethod as PaymentMethod,
        closedAt: new Date(),
      },
    });

    await this.db.table.update({
      where: { id: tab.tableId },
      data: { status: TableStatus.AVAILABLE },
    });

    return {
      success: true,
      message: 'Comanda fechada com sucesso',
      subtotal,
      serviceCharge,
      totalAmount,
      paymentMethod: dto.paymentMethod,
    };
  }

  async cancelTab(tabId: string, userId: string) {
    const user = await this.getCurrentUserWithRestaurant(userId);

    const tab = await this.db.tab.findFirst({
      where: { id: tabId },
      include: { table: true },
    });

    if (!tab) throw new NotFoundException('Comanda nao encontrada');
    if (tab.table.restaurantId !== user.restaurantId)
      throw new ForbiddenException('Acesso negado');
    if (tab.status !== TabStatus.OPEN)
      throw new BadRequestException('Comanda nao esta aberta');

    await this.db.tab.update({
      where: { id: tabId },
      data: { status: TabStatus.CANCELLED, closedAt: new Date() },
    });

    await this.db.table.update({
      where: { id: tab.tableId },
      data: { status: TableStatus.AVAILABLE },
    });

    return { success: true, message: 'Comanda cancelada' };
  }

  // ── HISTORY ──────────────────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toHistoryTabResponse(tab: any) {
    const subtotal = Number((tab.subtotal ?? tab.totalAmount).toString());
    const serviceCharge = Number((tab.serviceCharge ?? 0).toString());
    const totalAmount = Number(tab.totalAmount.toString());

    return {
      id: tab.id,
      tableId: tab.tableId,
      tableNumber: tab.table?.number ?? null,
      tableName: tab.table?.name ?? null,
      status: tab.status as TabStatus,
      subtotal,
      serviceCharge,
      totalAmount,
      paymentMethod: tab.paymentMethod ?? null,
      note: tab.note,
      openedAt: tab.openedAt,
      closedAt: tab.closedAt,
      itemCount: (tab.items ?? []).length,
      items: (tab.items ?? []).map((i: any) => this.toTabItemResponse(i)),
    };
  }

  async getTabHistory(userId: string, date: string, tzOffset: number) {
    const user = await this.getCurrentUserWithRestaurant(userId);

    // tzOffset = getTimezoneOffset() from the browser (e.g. 180 for UTC-3).
    // JavaScript's getTimezoneOffset() returns (UTC - local) in minutes,
    // so for UTC-3 it returns +180.
    //
    // Local midnight in UTC = UTC midnight + tzOffset minutes
    // Example: UTC-3 → local 00:00 = UTC 03:00
    //   dayStart = 2026-04-24T00:00:00Z + 180min = 2026-04-24T03:00:00Z ✓
    const utcMidnight = new Date(`${date}T00:00:00.000Z`);
    const dayStart = new Date(utcMidnight.getTime() + tzOffset * 60 * 1000);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const tabs = await this.db.tab.findMany({
      where: {
        table: { restaurantId: user.restaurantId },
        status: { in: [TabStatus.CLOSED, TabStatus.CANCELLED] },
        closedAt: { gte: dayStart, lt: dayEnd },
      },
      include: {
        table: { select: { number: true, name: true } },
        items: {
          include: { menuItem: { select: { name: true, category: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { closedAt: 'desc' },
    });

    const closedTabs = tabs.filter((t) => t.status === TabStatus.CLOSED);
    const totalRevenue = closedTabs.reduce(
      (sum, t) => sum + Number(t.totalAmount.toString()),
      0,
    );
    const avgTicket =
      closedTabs.length > 0
        ? Math.round((totalRevenue / closedTabs.length) * 100) / 100
        : 0;

    return {
      success: true,
      date,
      summary: {
        total: tabs.length,
        closed: closedTabs.length,
        cancelled: tabs.filter((t) => t.status === TabStatus.CANCELLED).length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        avgTicket,
      },
      tabs: tabs.map((t) => this.toHistoryTabResponse(t)),
    };
  }
}
