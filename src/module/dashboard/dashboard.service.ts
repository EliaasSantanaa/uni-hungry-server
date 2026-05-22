import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { TabStatus, UserRole } from 'generated/prisma/client';
import { DashboardStats } from './interfaces/dashboard-stats.interface';

function toNumber(value: unknown): number {
  if (value == null) return 0;
  return Number(value);
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly db: PrismaService) {}

  async getStats(): Promise<DashboardStats> {
    const allUsers = await this.db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const allRestaurants = await this.db.restaurant.findMany({
      select: { id: true, isActive: true },
    });

    const todayStart = startOfToday();

    const [
      totalMenuItems,
      availableMenuItems,
      totalTables,
      openTabs,
      closedTabsToday,
      cancelledTabsToday,
      revenueAggregate,
    ] = await Promise.all([
      this.db.menuItem.count(),
      this.db.menuItem.count({ where: { isAvailable: true } }),
      this.db.table.count(),
      this.db.tab.count({ where: { status: TabStatus.OPEN } }),
      this.db.tab.count({
        where: {
          status: TabStatus.CLOSED,
          closedAt: { gte: todayStart },
        },
      }),
      this.db.tab.count({
        where: {
          status: TabStatus.CANCELLED,
          updatedAt: { gte: todayStart },
        },
      }),
      this.db.tab.aggregate({
        where: {
          status: TabStatus.CLOSED,
          closedAt: { gte: todayStart },
        },
        _sum: { totalAmount: true },
      }),
    ]);

    const totalCustomers = allUsers.length;
    const activeCustomers = allUsers.filter((u) => u.isActive).length;

    return {
      totalCustomers,
      activeCustomers,
      inactiveCustomers: totalCustomers - activeCustomers,
      totalEmployees: allUsers.filter((u) => u.role !== UserRole.ADMIN).length,
      totalRestaurants: allRestaurants.length,
      activeRestaurants: allRestaurants.filter((r) => r.isActive).length,
      customersByRole: {
        admin: allUsers.filter((u) => u.role === UserRole.ADMIN).length,
        manager: allUsers.filter((u) => u.role === UserRole.MANAGER).length,
        waiter: allUsers.filter((u) => u.role === UserRole.WAITER).length,
        user: allUsers.filter((u) => u.role === UserRole.USER).length,
      },
      recentCustomers: allUsers.slice(0, 10).map((u) => ({
        id: u.id,
        name: u.name || 'Sem nome',
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
      })),
      operations: {
        totalMenuItems,
        availableMenuItems,
        totalTables,
        openTabs,
        closedTabsToday,
        cancelledTabsToday,
        revenueToday: toNumber(revenueAggregate._sum.totalAmount),
      },
    };
  }

  async getRestaurantsOverview() {
    const restaurants = await this.db.restaurant.findMany({
      include: {
        employees: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            menuItems: true,
            tables: true,
            employees: true,
          },
        },
        tables: {
          select: {
            tabs: {
              where: { status: TabStatus.OPEN },
              select: { id: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return restaurants.map((restaurant) => {
      const openTabsCount = restaurant.tables.reduce(
        (acc, table) => acc + table.tabs.length,
        0,
      );

      return {
        id: restaurant.id,
        name: restaurant.name,
        city: restaurant.city,
        state: restaurant.state,
        isActive: restaurant.isActive,
        employeesCount: restaurant._count.employees,
        activeEmployees: restaurant.employees.filter((e) => e.isActive).length,
        menuItemsCount: restaurant._count.menuItems,
        tablesCount: restaurant._count.tables,
        openTabsCount,
        owner: restaurant.employees.find((e) => e.role === UserRole.MANAGER),
        createdAt: restaurant.createdAt,
      };
    });
  }

  async getRestaurantById(id: string) {
    const restaurant = await this.db.restaurant.findUnique({
      where: { id },
      include: {
        employees: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            menuItems: true,
            tables: true,
            employees: true,
          },
        },
      },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurante não encontrado');
    }

    const [openTabs, closedTabs, menuAvailable] = await Promise.all([
      this.db.tab.count({
        where: {
          status: TabStatus.OPEN,
          table: { restaurantId: id },
        },
      }),
      this.db.tab.count({
        where: {
          status: TabStatus.CLOSED,
          table: { restaurantId: id },
        },
      }),
      this.db.menuItem.count({
        where: { restaurantId: id, isAvailable: true },
      }),
    ]);

    const revenueAggregate = await this.db.tab.aggregate({
      where: {
        status: TabStatus.CLOSED,
        table: { restaurantId: id },
        closedAt: { gte: startOfToday() },
      },
      _sum: { totalAmount: true },
    });

    return {
      id: restaurant.id,
      name: restaurant.name,
      cnpj: restaurant.cnpj,
      phone: restaurant.phone,
      address: restaurant.address,
      city: restaurant.city,
      state: restaurant.state,
      zipCode: restaurant.zipCode,
      isActive: restaurant.isActive,
      ownerId: restaurant.ownerId,
      createdAt: restaurant.createdAt,
      updatedAt: restaurant.updatedAt,
      counts: {
        employees: restaurant._count.employees,
        menuItems: restaurant._count.menuItems,
        menuItemsAvailable: menuAvailable,
        tables: restaurant._count.tables,
        openTabs,
        closedTabs,
        revenueToday: toNumber(revenueAggregate._sum.totalAmount),
      },
      employees: restaurant.employees,
    };
  }

  async getMenuItems(restaurantId?: string) {
    const items = await this.db.menuItem.findMany({
      where: restaurantId ? { restaurantId } : undefined,
      include: {
        restaurant: { select: { id: true, name: true } },
      },
      orderBy: [{ restaurant: { name: 'asc' } }, { name: 'asc' }],
    });

    return {
      total: items.length,
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: toNumber(item.price),
        category: item.category,
        isAvailable: item.isAvailable,
        imageUrl: item.imageUrl,
        restaurantId: item.restaurantId,
        restaurantName: item.restaurant.name,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
    };
  }

  async getTables(restaurantId?: string) {
    const tables = await this.db.table.findMany({
      where: restaurantId ? { restaurantId } : undefined,
      include: {
        restaurant: { select: { id: true, name: true } },
        tabs: {
          where: { status: TabStatus.OPEN },
          select: { id: true, totalAmount: true, openedAt: true },
          take: 1,
        },
      },
      orderBy: [{ restaurant: { name: 'asc' } }, { number: 'asc' }],
    });

    return {
      total: tables.length,
      tables: tables.map((table) => ({
        id: table.id,
        number: table.number,
        name: table.name,
        capacity: table.capacity,
        status: table.status,
        restaurantId: table.restaurantId,
        restaurantName: table.restaurant.name,
        hasOpenTab: table.tabs.length > 0,
        openTab: table.tabs[0]
          ? {
              id: table.tabs[0].id,
              totalAmount: toNumber(table.tabs[0].totalAmount),
              openedAt: table.tabs[0].openedAt,
            }
          : null,
        createdAt: table.createdAt,
      })),
    };
  }

  async getTabs(params: {
    restaurantId?: string;
    status?: TabStatus;
    limit?: number;
  }) {
    const limit = Math.min(params.limit ?? 50, 200);

    const tabs = await this.db.tab.findMany({
      where: {
        ...(params.status ? { status: params.status } : {}),
        ...(params.restaurantId
          ? { table: { restaurantId: params.restaurantId } }
          : {}),
      },
      include: {
        table: {
          select: {
            id: true,
            number: true,
            name: true,
            restaurant: { select: { id: true, name: true } },
          },
        },
        items: {
          select: { id: true, quantity: true },
        },
      },
      orderBy: { openedAt: 'desc' },
      take: limit,
    });

    return {
      total: tabs.length,
      tabs: tabs.map((tab) => ({
        id: tab.id,
        status: tab.status,
        subtotal: toNumber(tab.subtotal),
        serviceCharge: toNumber(tab.serviceCharge),
        totalAmount: toNumber(tab.totalAmount),
        paymentMethod: tab.paymentMethod,
        note: tab.note,
        itemsCount: tab.items.length,
        openedAt: tab.openedAt,
        closedAt: tab.closedAt,
        table: {
          id: tab.table.id,
          number: tab.table.number,
          name: tab.table.name,
        },
        restaurant: {
          id: tab.table.restaurant.id,
          name: tab.table.restaurant.name,
        },
      })),
    };
  }

  async getTabById(tabId: string) {
    const tab = await this.db.tab.findUnique({
      where: { id: tabId },
      include: {
        table: {
          include: {
            restaurant: { select: { id: true, name: true } },
          },
        },
        items: {
          include: {
            menuItem: { select: { id: true, name: true, category: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!tab) {
      throw new NotFoundException('Comanda não encontrada');
    }

    return {
      id: tab.id,
      status: tab.status,
      subtotal: toNumber(tab.subtotal),
      serviceCharge: toNumber(tab.serviceCharge),
      totalAmount: toNumber(tab.totalAmount),
      paymentMethod: tab.paymentMethod,
      note: tab.note,
      openedAt: tab.openedAt,
      closedAt: tab.closedAt,
      table: tab.table,
      restaurant: tab.table.restaurant,
      items: tab.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        unitPrice: toNumber(item.unitPrice),
        note: item.note,
        menuItem: item.menuItem,
        lineTotal: toNumber(item.unitPrice) * item.quantity,
      })),
    };
  }
}
