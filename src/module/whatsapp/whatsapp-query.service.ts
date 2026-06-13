import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { TabStatus, TableStatus } from 'generated/prisma/client';

function toNumber(v: unknown): number {
  return v == null ? 0 : Number(v);
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

@Injectable()
export class WhatsAppQueryService {
  constructor(private readonly db: PrismaService) {}

  // ── Usado para resolver nome → id ──────────────────────────────────────
  async findRestaurantByName(name: string) {
    return this.db.restaurant.findFirst({
      where: { name: { contains: name, mode: 'insensitive' }, isActive: true },
      select: { id: true, name: true },
    });
  }

  async listRestaurants() {
    return this.db.restaurant.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
        _count: { select: { employees: true, tables: true, menuItems: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  // ── Funções que a IA pode chamar ───────────────────────────────────────

  async getTables(restaurantId: string, status?: TableStatus) {
    const tables = await this.db.table.findMany({
      where: {
        restaurantId,
        ...(status ? { status } : {}),
      },
      include: {
        tabs: {
          where: { status: TabStatus.OPEN },
          select: {
            id: true,
            totalAmount: true,
            openedAt: true,
            items: { select: { quantity: true } },
          },
          take: 1,
        },
      },
      orderBy: { number: 'asc' },
    });

    return tables.map((t) => ({
      id: t.id,
      identifier: t.name ?? `Mesa ${t.number}`,
      capacity: t.capacity,
      status: t.status,
      openTab: t.tabs[0]
        ? {
            total: toNumber(t.tabs[0].totalAmount),
            openedAt: t.tabs[0].openedAt,
            itemsCount: t.tabs[0].items.reduce((a, i) => a + i.quantity, 0),
          }
        : null,
    }));
  }

  async getEmployees(restaurantId: string, onlyActive?: boolean) {
    return this.db.user.findMany({
      where: {
        restaurantId,
        ...(onlyActive ? { isActive: true } : {}),
      },
      select: {
        name: true,
        email: true,
        role: true,
        isActive: true,
        phone: true,
        createdAt: true,
      },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
    });
  }

  async getSalesToday(restaurantId: string) {
    const today = startOfToday();

    const [openTabs, closedTabs, revenue, topItems] = await Promise.all([
      this.db.tab.findMany({
        where: { status: TabStatus.OPEN, table: { restaurantId } },
        include: {
          table: { select: { number: true, name: true } },
          items: {
            include: { menuItem: { select: { name: true } } },
          },
        },
      }),
      this.db.tab.count({
        where: {
          status: TabStatus.CLOSED,
          closedAt: { gte: today },
          table: { restaurantId },
        },
      }),
      this.db.tab.aggregate({
        where: {
          status: TabStatus.CLOSED,
          closedAt: { gte: today },
          table: { restaurantId },
        },
        _sum: { totalAmount: true },
      }),
      this.db.tabItem.findMany({
        where: {
          tab: {
            status: TabStatus.CLOSED,
            closedAt: { gte: today },
            table: { restaurantId },
          },
        },
        include: { menuItem: { select: { name: true } } },
        orderBy: { quantity: 'desc' },
        take: 5,
      }),
    ]);

    return {
      revenueTotal: toNumber(revenue._sum.totalAmount),
      closedTabsCount: closedTabs,
      openTabsCount: openTabs.length,
      openTabsDetail: openTabs.map((tab) => ({
        table: tab.table.name ?? `Mesa ${tab.table.number}`,
        currentTotal: toNumber(tab.totalAmount),
        openedAt: tab.openedAt,
        itemsCount: tab.items.reduce((a, i) => a + i.quantity, 0),
      })),
      topItemsToday: topItems.map((i) => ({
        name: i.menuItem.name,
        quantity: i.quantity,
      })),
    };
  }

  async getMenu(restaurantId: string, onlyAvailable?: boolean) {
    const items = await this.db.menuItem.findMany({
      where: {
        restaurantId,
        ...(onlyAvailable ? { isAvailable: true } : {}),
      },
      select: {
        name: true,
        description: true,
        price: true,
        category: true,
        isAvailable: true,
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    // Agrupa por categoria
    const grouped: Record<string, typeof items> = {};
    for (const item of items) {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    }

    return grouped;
  }

  async getRestaurantSummary(restaurantId: string) {
    const [restaurant, employees, tables, sales] = await Promise.all([
      this.db.restaurant.findUnique({
        where: { id: restaurantId },
        select: {
          name: true,
          city: true,
          state: true,
          phone: true,
          address: true,
          isActive: true,
        },
      }),
      this.getEmployees(restaurantId),
      this.getTables(restaurantId),
      this.getSalesToday(restaurantId),
    ]);

    return { restaurant, employees, tables, sales };
  }
}
