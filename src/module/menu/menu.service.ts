import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { MenuCategory, UserRole } from 'generated/prisma/client';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

@Injectable()
export class MenuService {
  constructor(private readonly db: PrismaService) {}

  private normalizeOptionalString(value?: string): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private toMenuResponse(item: {
    id: string;
    name: string;
    description: string | null;
    price: { toString(): string };
    category: MenuCategory;
    isAvailable: boolean;
    imageUrl: string | null;
    restaurantId: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      price: Number(item.price.toString()),
      category: item.category,
      isAvailable: item.isAvailable,
      imageUrl: item.imageUrl,
      restaurantId: item.restaurantId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private async getCurrentUserWithRestaurant(userId: string): Promise<{
    id: string;
    role: UserRole;
    restaurantId: string;
  }> {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        isActive: true,
        restaurantId: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario logado nao encontrado');
    }

    if (!user.isActive) {
      throw new ForbiddenException(
        'Usuario inativo nao pode gerenciar cardapio',
      );
    }

    if (user.role === UserRole.ADMIN) {
      throw new ForbiddenException(
        'Administrador nao possui restaurante vinculado para gerenciar cardapio',
      );
    }

    if (!user.restaurantId) {
      throw new ForbiddenException(
        'Voce precisa de restaurante vinculado para gerenciar cardapio',
      );
    }

    return {
      id: user.id,
      role: user.role,
      restaurantId: user.restaurantId,
    };
  }

  async listMyMenuItems(currentUserId: string, category?: MenuCategory) {
    const user = await this.getCurrentUserWithRestaurant(currentUserId);

    const items = await this.db.menuItem.findMany({
      where: {
        restaurantId: user.restaurantId,
        ...(category ? { category } : {}),
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    return {
      success: true,
      total: items.length,
      items: items.map((item) => this.toMenuResponse(item)),
    };
  }

  async createMenuItem(
    createMenuItemDto: CreateMenuItemDto,
    currentUserId: string,
  ) {
    const user = await this.getCurrentUserWithRestaurant(currentUserId);

    const normalizedName = createMenuItemDto.name.trim();
    const normalizedDescription = this.normalizeOptionalString(
      createMenuItemDto.description,
    );
    const normalizedImageUrl = this.normalizeOptionalString(
      createMenuItemDto.imageUrl,
    );

    const existing = await this.db.menuItem.findFirst({
      where: {
        restaurantId: user.restaurantId,
        name: normalizedName,
        category: createMenuItemDto.category,
      },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException(
        'Ja existe item com esse nome nesta categoria para este restaurante',
      );
    }

    const item = await this.db.menuItem.create({
      data: {
        name: normalizedName,
        description: normalizedDescription,
        price: createMenuItemDto.price,
        category: createMenuItemDto.category,
        isAvailable: createMenuItemDto.isAvailable ?? true,
        imageUrl: normalizedImageUrl,
        restaurantId: user.restaurantId,
      },
    });

    return {
      success: true,
      message: 'Item do cardapio cadastrado com sucesso',
      item: this.toMenuResponse(item),
    };
  }

  async getMenuItemById(itemId: string, currentUserId: string) {
    const user = await this.getCurrentUserWithRestaurant(currentUserId);

    const item = await this.db.menuItem.findFirst({
      where: {
        id: itemId,
        restaurantId: user.restaurantId,
      },
    });

    if (!item) {
      throw new NotFoundException('Item do cardapio nao encontrado');
    }

    return {
      success: true,
      item: this.toMenuResponse(item),
    };
  }

  async updateMenuItem(
    itemId: string,
    updateMenuItemDto: UpdateMenuItemDto,
    currentUserId: string,
  ) {
    const user = await this.getCurrentUserWithRestaurant(currentUserId);

    const item = await this.db.menuItem.findFirst({
      where: {
        id: itemId,
        restaurantId: user.restaurantId,
      },
    });

    if (!item) {
      throw new NotFoundException('Item do cardapio nao encontrado');
    }

    const dataToUpdate: {
      name?: string;
      description?: string | null;
      price?: number;
      category?: MenuCategory;
      isAvailable?: boolean;
      imageUrl?: string | null;
    } = {};

    if (Object.prototype.hasOwnProperty.call(updateMenuItemDto, 'name')) {
      const normalizedName = updateMenuItemDto.name?.trim();

      if (!normalizedName) {
        throw new BadRequestException('Nome do produto nao pode ser vazio');
      }

      dataToUpdate.name = normalizedName;
    }

    if (
      Object.prototype.hasOwnProperty.call(updateMenuItemDto, 'description')
    ) {
      dataToUpdate.description = this.normalizeOptionalString(
        updateMenuItemDto.description,
      );
    }

    if (Object.prototype.hasOwnProperty.call(updateMenuItemDto, 'price')) {
      const price = updateMenuItemDto.price;

      if (typeof price !== 'number' || price <= 0) {
        throw new BadRequestException('Preco deve ser maior que zero');
      }

      dataToUpdate.price = price;
    }

    if (Object.prototype.hasOwnProperty.call(updateMenuItemDto, 'category')) {
      dataToUpdate.category = updateMenuItemDto.category;
    }

    if (
      Object.prototype.hasOwnProperty.call(updateMenuItemDto, 'isAvailable')
    ) {
      dataToUpdate.isAvailable = Boolean(updateMenuItemDto.isAvailable);
    }

    if (Object.prototype.hasOwnProperty.call(updateMenuItemDto, 'imageUrl')) {
      dataToUpdate.imageUrl = this.normalizeOptionalString(
        updateMenuItemDto.imageUrl,
      );
    }

    if (!Object.keys(dataToUpdate).length) {
      throw new BadRequestException(
        'Nenhum campo valido informado para atualizacao',
      );
    }

    if (dataToUpdate.name || dataToUpdate.category) {
      const duplicate = await this.db.menuItem.findFirst({
        where: {
          id: { not: item.id },
          restaurantId: user.restaurantId,
          name: dataToUpdate.name ?? item.name,
          category: dataToUpdate.category ?? item.category,
        },
        select: { id: true },
      });

      if (duplicate) {
        throw new BadRequestException(
          'Ja existe item com esse nome nesta categoria para este restaurante',
        );
      }
    }

    const updated = await this.db.menuItem.update({
      where: { id: item.id },
      data: dataToUpdate,
    });

    return {
      success: true,
      message: 'Item do cardapio atualizado com sucesso',
      item: this.toMenuResponse(updated),
    };
  }

  async deleteMenuItem(itemId: string, currentUserId: string) {
    const user = await this.getCurrentUserWithRestaurant(currentUserId);

    const item = await this.db.menuItem.findFirst({
      where: {
        id: itemId,
        restaurantId: user.restaurantId,
      },
      select: {
        id: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Item do cardapio nao encontrado');
    }

    await this.db.menuItem.delete({
      where: { id: item.id },
    });

    return {
      success: true,
      message: 'Item do cardapio removido com sucesso',
    };
  }
}
