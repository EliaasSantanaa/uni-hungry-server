import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { UserRole } from 'generated/prisma/client';

@Injectable()
export class RestaurantsService {
  private readonly logger = new Logger(RestaurantsService.name);

  constructor(private readonly db: PrismaService) {}

  // Buscar restaurante do usuário
  async getUserRestaurant(userId: string) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      include: {
        restaurant: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // ADMIN não tem restaurante
    if (user.role === UserRole.ADMIN) {
      return {
        hasRestaurant: false,
        message: 'Administradores não possuem restaurante vinculado',
      };
    }

    // Se não tem restaurante
    if (!user.restaurant) {
      return {
        hasRestaurant: false,
        message: 'Você ainda não cadastrou seu restaurante',
        canCreate: user.role === UserRole.MANAGER,
      };
    }

    // Retorna o restaurante
    return {
      hasRestaurant: true,
      restaurant: user.restaurant,
    };
  }

  // Buscar estatísticas do restaurante
  async getRestaurantStats(userId: string) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: {
        restaurantId: true,
        role: true,
      },
    });

    if (!user || !user.restaurantId) {
      return {
        hasRestaurant: false,
        stats: null,
      };
    }

    // Busca funcionários do restaurante
    const employees = await this.db.user.findMany({
      where: { restaurantId: user.restaurantId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Busca dados do restaurante
    const restaurant = await this.db.restaurant.findUnique({
      where: { id: user.restaurantId },
    });

    if (!restaurant) {
      return {
        hasRestaurant: false,
        stats: null,
      };
    }

    // Calcula estatísticas
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter((e) => e.isActive).length;
    const managers = employees.filter(
      (e) => e.role === UserRole.MANAGER,
    ).length;
    const waiters = employees.filter((e) => e.role === UserRole.WAITER).length;

    return {
      hasRestaurant: true,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        city: restaurant.city,
        state: restaurant.state,
        isActive: restaurant.isActive,
      },
      stats: {
        totalEmployees,
        activeEmployees,
        inactiveEmployees: totalEmployees - activeEmployees,
        managers,
        waiters,
      },
      recentEmployees: employees.slice(0, 5).map((e) => ({
        id: e.id,
        name: e.name || 'Sem nome',
        email: e.email,
        role: e.role,
        isActive: e.isActive,
        createdAt: e.createdAt,
      })),
    };
  }

  // Criar restaurante
  async create(createRestaurantDto: CreateRestaurantDto, userId: string) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Apenas MANAGER pode criar restaurante
    if (user.role !== UserRole.MANAGER) {
      throw new ForbiddenException(
        'Apenas gerentes podem cadastrar restaurantes',
      );
    }

    // Verifica se já tem restaurante
    if (user.restaurantId) {
      throw new BadRequestException('Você já possui um restaurante cadastrado');
    }

    // Verifica se CNPJ já existe (se fornecido)
    if (createRestaurantDto.cnpj) {
      const existingRestaurant = await this.db.restaurant.findUnique({
        where: { cnpj: createRestaurantDto.cnpj },
      });

      if (existingRestaurant) {
        throw new BadRequestException('CNPJ já cadastrado');
      }
    }

    // Cria o restaurante
    const restaurant = await this.db.restaurant.create({
      data: {
        name: createRestaurantDto.name,
        cnpj: createRestaurantDto.cnpj,
        phone: createRestaurantDto.phone,
        address: createRestaurantDto.address,
        city: createRestaurantDto.city,
        state: createRestaurantDto.state,
        zipCode: createRestaurantDto.zipCode,
        ownerId: userId,
      },
    });

    // Atualiza o usuário com o restaurantId
    await this.db.user.update({
      where: { id: userId },
      data: { restaurantId: restaurant.id },
    });

    this.logger.log(
      `Restaurante criado: ${restaurant.name} (${restaurant.id}) por ${user.email}`,
    );

    return {
      success: true,
      message: 'Restaurante cadastrado com sucesso',
      restaurant,
    };
  }

  // Buscar por ID
  async findOne(id: string) {
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
          },
        },
      },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurante não encontrado');
    }

    return restaurant;
  }

  // Atualizar restaurante
  async update(
    id: string,
    updateRestaurantDto: UpdateRestaurantDto,
    userId: string,
  ) {
    const restaurant = await this.db.restaurant.findUnique({
      where: { id },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurante não encontrado');
    }

    // Verifica se o usuário é dono do restaurante
    if (restaurant.ownerId !== userId) {
      const user = await this.db.user.findUnique({
        where: { id: userId },
      });

      // ADMIN pode atualizar qualquer restaurante
      if (user?.role !== UserRole.ADMIN) {
        throw new ForbiddenException(
          'Você não tem permissão para atualizar este restaurante',
        );
      }
    }

    // Atualiza
    const updated = await this.db.restaurant.update({
      where: { id },
      data: updateRestaurantDto,
    });

    this.logger.log(`Restaurante atualizado: ${updated.name} (${updated.id})`);

    return {
      success: true,
      message: 'Restaurante atualizado com sucesso',
      restaurant: updated,
    };
  }
}
