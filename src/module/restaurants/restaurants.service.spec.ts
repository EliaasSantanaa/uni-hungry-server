import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { PrismaService } from 'src/database/prisma.service';
import { UserRole } from 'generated/prisma/client';

const mockDb = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  restaurant: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

describe('RestaurantsService', () => {
  let service: RestaurantsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestaurantsService,
        { provide: PrismaService, useValue: mockDb },
      ],
    }).compile();

    service = module.get<RestaurantsService>(RestaurantsService);
    jest.clearAllMocks();
  });

  describe('getUserRestaurant', () => {
    it('lança NotFoundException se usuário não for encontrado', async () => {
      mockDb.user.findUnique.mockResolvedValue(null);
      await expect(service.getUserRestaurant('1')).rejects.toThrow(NotFoundException);
    });

    it('retorna mensagem para ADMIN', async () => {
      mockDb.user.findUnique.mockResolvedValue({ role: UserRole.ADMIN });
      const result = await service.getUserRestaurant('1');
      expect(result.hasRestaurant).toBe(false);
    });

    it('retorna false para gerente sem restaurante', async () => {
      mockDb.user.findUnique.mockResolvedValue({ role: UserRole.MANAGER, restaurant: null });
      const result = await service.getUserRestaurant('1');
      expect(result.hasRestaurant).toBe(false);
      expect(result.canCreate).toBe(true);
    });

    it('retorna dados se restaurante for encontrado', async () => {
      mockDb.user.findUnique.mockResolvedValue({
        role: UserRole.MANAGER,
        restaurant: { id: 'r1' },
      });
      const result = await service.getUserRestaurant('1');
      expect(result.hasRestaurant).toBe(true);
      expect(result.restaurant?.id).toBe('r1');
    });
  });

  describe('getRestaurantStats', () => {
    it('retorna sem restaurante se user não tem restauranteId', async () => {
      mockDb.user.findUnique.mockResolvedValue({ restaurantId: null });
      const result = await service.getRestaurantStats('1');
      expect(result.hasRestaurant).toBe(false);
    });

    it('retorna estatísticas completas com funcionários', async () => {
      mockDb.user.findUnique.mockResolvedValue({ restaurantId: 'r1' });
      mockDb.user.findMany.mockResolvedValue([{ id: '2', role: UserRole.MANAGER, isActive: true }]);
      mockDb.restaurant.findUnique.mockResolvedValue({ id: 'r1', name: 'Rest' });

      const result = await service.getRestaurantStats('1');
      expect(result.hasRestaurant).toBe(true);
      expect(result.stats?.totalEmployees).toBe(1);
    });
  });

  describe('create', () => {
    const dto = { name: 'Novo', cnpj: '123' };

    it('lança ForbiddenException se usuário não for MANAGER', async () => {
      mockDb.user.findUnique.mockResolvedValue({ role: UserRole.WAITER });
      await expect(service.create(dto as any, '1')).rejects.toThrow(ForbiddenException);
    });

    it('lança BadRequestException se usuário já tiver restaurante', async () => {
      mockDb.user.findUnique.mockResolvedValue({ role: UserRole.MANAGER, restaurantId: 'r1' });
      await expect(service.create(dto as any, '1')).rejects.toThrow(BadRequestException);
    });

    it('lança BadRequestException se CNPJ já existir', async () => {
      mockDb.user.findUnique.mockResolvedValue({ role: UserRole.MANAGER, restaurantId: null });
      mockDb.restaurant.findUnique.mockResolvedValue({ id: 'r2' });
      await expect(service.create(dto as any, '1')).rejects.toThrow(BadRequestException);
    });

    it('cria restaurante com sucesso', async () => {
      mockDb.user.findUnique.mockResolvedValue({ role: UserRole.MANAGER, restaurantId: null });
      mockDb.restaurant.findUnique.mockResolvedValue(null);
      mockDb.restaurant.create.mockResolvedValue({ id: 'r1', name: 'Novo' });
      mockDb.user.update.mockResolvedValue({});

      const result = await service.create(dto as any, '1');
      expect(result.success).toBe(true);
      expect(result.restaurant.id).toBe('r1');
    });
  });

  describe('findOne', () => {
    it('lança NotFoundException se não existir', async () => {
      mockDb.restaurant.findUnique.mockResolvedValue(null);
      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });

    it('retorna restaurante', async () => {
      mockDb.restaurant.findUnique.mockResolvedValue({ id: 'r1' });
      expect(await service.findOne('1')).toEqual({ id: 'r1' });
    });
  });

  describe('update', () => {
    it('lança NotFoundException se não existir', async () => {
      mockDb.restaurant.findUnique.mockResolvedValue(null);
      await expect(service.update('r1', {}, 'u1')).rejects.toThrow(NotFoundException);
    });

    it('lança ForbiddenException se não for dono nem admin', async () => {
      mockDb.restaurant.findUnique.mockResolvedValue({ id: 'r1', ownerId: 'u2' });
      mockDb.user.findUnique.mockResolvedValue({ role: UserRole.MANAGER });
      await expect(service.update('r1', {}, 'u1')).rejects.toThrow(ForbiddenException);
    });

    it('atualiza restaurante com sucesso', async () => {
      mockDb.restaurant.findUnique.mockResolvedValue({ id: 'r1', ownerId: 'u1' });
      mockDb.restaurant.update.mockResolvedValue({ id: 'r1', name: 'Updated' });

      const result = await service.update('r1', { name: 'Updated' }, 'u1');
      expect(result.success).toBe(true);
      expect(result.restaurant.name).toBe('Updated');
    });
  });
});
