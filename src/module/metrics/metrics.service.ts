import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { UserRole } from 'generated/prisma/client';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  constructor(private readonly db: PrismaService) {}

  // Lista de usuários para o select (MANAGER e WAITER)
  async getUsersList() {
    const users = await this.db.user.findMany({
      where: {
        role: {
          in: [UserRole.MANAGER, UserRole.WAITER],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        restaurantId: true,
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return users.map((user) => ({
      id: user.id,
      name: user.name || user.email,
      email: user.email,
      role: user.role,
      restaurantName: user.restaurant?.name || 'Sem restaurante',
      hasRestaurant: !!user.restaurantId,
    }));
  }

  // Métricas detalhadas de um usuário
  async getUserMetrics(userId: string) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      include: {
        restaurant: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Se não tem restaurante
    if (!user.restaurantId || !user.restaurant) {
      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
        },
        hasRestaurant: false,
        message: 'Este usuário não possui restaurante vinculado',
      };
    }

    // Busca todos os funcionários do restaurante
    const employees = await this.db.user.findMany({
      where: { restaurantId: user.restaurantId },
      orderBy: { createdAt: 'desc' },
    });

    // Calcula estatísticas
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter((e) => e.isActive).length;
    const inactiveEmployees = totalEmployees - activeEmployees;
    const managers = employees.filter(
      (e) => e.role === UserRole.MANAGER,
    ).length;
    const waiters = employees.filter((e) => e.role === UserRole.WAITER).length;

    // Funcionários ativos vs inativos por mês (últimos 6 meses)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const employeesByMonth = await this.getEmployeesByMonth(
      user.restaurantId,
      sixMonthsAgo,
    );

    // Distribuição por role
    const roleDistribution = [
      { name: 'Gerentes', value: managers, fill: '#3b82f6' },
      { name: 'Garçons', value: waiters, fill: '#eab308' },
    ];

    // Status distribution
    const statusDistribution = [
      { name: 'Ativos', value: activeEmployees, fill: '#22c55e' },
      { name: 'Inativos', value: inactiveEmployees, fill: '#ef4444' },
    ];

    // Lista de funcionários recentes
    const recentEmployees = employees.slice(0, 10).map((e) => ({
      id: e.id,
      name: e.name || 'Sem nome',
      email: e.email,
      role: e.role,
      isActive: e.isActive,
      createdAt: e.createdAt,
    }));

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
      hasRestaurant: true,
      restaurant: {
        id: user.restaurant.id,
        name: user.restaurant.name,
        cnpj: user.restaurant.cnpj,
        phone: user.restaurant.phone,
        address: user.restaurant.address,
        city: user.restaurant.city,
        state: user.restaurant.state,
        isActive: user.restaurant.isActive,
        createdAt: user.restaurant.createdAt,
      },
      stats: {
        totalEmployees,
        activeEmployees,
        inactiveEmployees,
        managers,
        waiters,
      },
      charts: {
        employeesByMonth,
        roleDistribution,
        statusDistribution,
      },
      recentEmployees,
    };
  }

  // Funcionários cadastrados por mês
  private async getEmployeesByMonth(restaurantId: string, startDate: Date) {
    const employees = await this.db.user.findMany({
      where: {
        restaurantId,
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
        isActive: true,
      },
    });

    // Agrupa por mês
    const monthsMap = new Map<string, { ativos: number; inativos: number }>();

    employees.forEach((employee) => {
      const monthKey = new Date(employee.createdAt).toLocaleDateString(
        'pt-BR',
        {
          month: 'short',
          year: 'numeric',
        },
      );

      if (!monthsMap.has(monthKey)) {
        monthsMap.set(monthKey, { ativos: 0, inativos: 0 });
      }

      const data = monthsMap.get(monthKey)!;
      if (employee.isActive) {
        data.ativos++;
      } else {
        data.inativos++;
      }
    });

    // Converte para array
    return Array.from(monthsMap.entries()).map(([month, data]) => ({
      month,
      ativos: data.ativos,
      inativos: data.inativos,
      total: data.ativos + data.inativos,
    }));
  }
}
