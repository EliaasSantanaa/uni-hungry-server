import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { UserRole } from 'generated/prisma/client';
import { DashboardStats } from './interfaces/dashboard-stats.interface';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly db: PrismaService) {}

  async getStats(): Promise<DashboardStats> {
    // Busca todos os usuários
    const allUsers = await this.db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Busca todos os restaurantes
    const allRestaurants = await this.db.restaurant.findMany({
      select: {
        id: true,
        isActive: true,
      },
    });

    // Calcula estatísticas
    const totalCustomers = allUsers.length;
    const activeCustomers = allUsers.filter((u) => u.isActive).length;
    const inactiveCustomers = totalCustomers - activeCustomers;

    // Conta funcionários (todos exceto ADMIN)
    const totalEmployees = allUsers.filter(
      (u) => u.role !== UserRole.ADMIN,
    ).length;

    // Estatísticas de restaurantes
    const totalRestaurants = allRestaurants.length;
    const activeRestaurants = allRestaurants.filter((r) => r.isActive).length;

    // Clientes por role
    const customersByRole = {
      admin: allUsers.filter((u) => u.role === UserRole.ADMIN).length,
      manager: allUsers.filter((u) => u.role === UserRole.MANAGER).length,
      waiter: allUsers.filter((u) => u.role === UserRole.WAITER).length,
      user: allUsers.filter((u) => u.role === UserRole.USER).length,
    };

    // Últimos 10 clientes cadastrados
    const recentCustomers = allUsers.slice(0, 10).map((u) => ({
      id: u.id,
      name: u.name || 'Sem nome',
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
    }));

    return {
      totalCustomers,
      activeCustomers,
      inactiveCustomers,
      totalEmployees,
      totalRestaurants,
      activeRestaurants,
      customersByRole,
      recentCustomers,
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return restaurants.map((restaurant) => ({
      id: restaurant.id,
      name: restaurant.name,
      city: restaurant.city,
      state: restaurant.state,
      isActive: restaurant.isActive,
      employeesCount: restaurant.employees.length,
      activeEmployees: restaurant.employees.filter((e) => e.isActive).length,
      owner: restaurant.employees.find((e) => e.role === UserRole.MANAGER),
      createdAt: restaurant.createdAt,
    }));
  }
}
