import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MenuCategory, UserRole } from 'generated/prisma/client';
import { MenuService } from './menu.service';
import { PrismaService } from 'src/database/prisma.service';

// ──────────────────────────────────────────────
// Factories
// ──────────────────────────────────────────────

const makeDbUser = (overrides = {}) => ({
  id: 'user-1',
  role: UserRole.MANAGER,
  isActive: true,
  restaurantId: 'rest-1',
  ...overrides,
});

const makeMenuItem = (overrides = {}) => ({
  id: 'menu-1',
  name: 'X-Burger',
  description: 'Delicioso',
  price: { toString: () => '25.90' },
  category: MenuCategory.PRATO_PRINCIPAL,
  isAvailable: true,
  imageUrl: null,
  restaurantId: 'rest-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// ──────────────────────────────────────────────
// Mocks
// ──────────────────────────────────────────────

const mockDb = {
  user: { findUnique: jest.fn() },
  menuItem: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

// ──────────────────────────────────────────────
// Suite
// ──────────────────────────────────────────────

describe('MenuService', () => {
  let service: MenuService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenuService,
        { provide: PrismaService, useValue: mockDb },
      ],
    }).compile();

    service = module.get<MenuService>(MenuService);
    jest.clearAllMocks();
  });

  const setupUser = (overrides = {}) =>
    mockDb.user.findUnique.mockResolvedValue(makeDbUser(overrides));

  // ── getCurrentUserWithRestaurant (guards) ──────────────────────────────────
  describe('getCurrentUserWithRestaurant', () => {
    it('lança NotFoundException se usuário não existir', async () => {
      mockDb.user.findUnique.mockResolvedValue(null);
      await expect(service.listMyMenuItems('user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lança ForbiddenException se usuário estiver inativo', async () => {
      setupUser({ isActive: false });
      await expect(service.listMyMenuItems('user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('lança ForbiddenException se usuário for ADMIN', async () => {
      setupUser({ role: UserRole.ADMIN });
      await expect(service.listMyMenuItems('user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('lança ForbiddenException se usuário não tiver restaurante', async () => {
      setupUser({ restaurantId: null });
      await expect(service.listMyMenuItems('user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ── listMyMenuItems ────────────────────────────────────────────────────────
  describe('listMyMenuItems', () => {
    it('deve retornar lista de itens com sucesso sem filtro', async () => {
      setupUser();
      mockDb.menuItem.findMany.mockResolvedValue([makeMenuItem()]);

      const result = await service.listMyMenuItems('user-1');

      expect(result.success).toBe(true);
      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(mockDb.menuItem.findMany).toHaveBeenCalledWith({
        where: { restaurantId: 'rest-1' },
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      });
    });

    it('deve retornar lista de itens com sucesso com filtro de categoria', async () => {
      setupUser();
      mockDb.menuItem.findMany.mockResolvedValue([makeMenuItem()]);

      const result = await service.listMyMenuItems('user-1', MenuCategory.PRATO_PRINCIPAL);

      expect(result.success).toBe(true);
      expect(mockDb.menuItem.findMany).toHaveBeenCalledWith({
        where: { restaurantId: 'rest-1', category: MenuCategory.PRATO_PRINCIPAL },
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      });
    });
  });

  // ── createMenuItem ─────────────────────────────────────────────────────────
  describe('createMenuItem', () => {
    const dto = {
      name: 'X-Salada ',
      description: ' Muito bom ',
      price: 20.0,
      category: MenuCategory.PRATO_PRINCIPAL,
    };

    it('lança BadRequestException se já existir item com mesmo nome e categoria', async () => {
      setupUser();
      mockDb.menuItem.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(service.createMenuItem(dto as any, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve criar item com sucesso, normalizando strings', async () => {
      setupUser();
      mockDb.menuItem.findFirst.mockResolvedValue(null);
      mockDb.menuItem.create.mockResolvedValue(
        makeMenuItem({ name: 'X-Salada', description: 'Muito bom' }),
      );

      const result = await service.createMenuItem(dto as any, 'user-1');

      expect(result.success).toBe(true);
      expect(result.item.name).toBe('X-Salada');
      expect(mockDb.menuItem.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'X-Salada',
          description: 'Muito bom',
          price: 20.0,
          category: MenuCategory.PRATO_PRINCIPAL,
          isAvailable: true,
          imageUrl: null,
          restaurantId: 'rest-1',
        }),
      });
    });
  });

  // ── getMenuItemById ────────────────────────────────────────────────────────
  describe('getMenuItemById', () => {
    it('lança NotFoundException se item não existir', async () => {
      setupUser();
      mockDb.menuItem.findFirst.mockResolvedValue(null);

      await expect(service.getMenuItemById('menu-999', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve retornar item com sucesso', async () => {
      setupUser();
      mockDb.menuItem.findFirst.mockResolvedValue(makeMenuItem());

      const result = await service.getMenuItemById('menu-1', 'user-1');

      expect(result.success).toBe(true);
      expect(result.item).toBeDefined();
    });
  });

  // ── updateMenuItem ─────────────────────────────────────────────────────────
  describe('updateMenuItem', () => {
    it('lança NotFoundException se item não existir', async () => {
      setupUser();
      mockDb.menuItem.findFirst.mockResolvedValue(null);

      await expect(
        service.updateMenuItem('menu-999', { name: 'Novo' }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('lança BadRequestException se nome for vazio', async () => {
      setupUser();
      mockDb.menuItem.findFirst.mockResolvedValue(makeMenuItem());

      await expect(
        service.updateMenuItem('menu-1', { name: '  ' }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('lança BadRequestException se preço for inválido', async () => {
      setupUser();
      mockDb.menuItem.findFirst.mockResolvedValue(makeMenuItem());

      await expect(
        service.updateMenuItem('menu-1', { price: -5 }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('lança BadRequestException se nenhum campo for válido', async () => {
      setupUser();
      mockDb.menuItem.findFirst.mockResolvedValue(makeMenuItem());

      await expect(
        service.updateMenuItem('menu-1', {} as any, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('lança BadRequestException se tentar alterar nome/categoria para um já existente', async () => {
      setupUser();
      // Primeira busca: o item existe e é daquele restaurante
      mockDb.menuItem.findFirst
        .mockResolvedValueOnce(makeMenuItem())
        // Segunda busca: verifica duplicidade
        .mockResolvedValueOnce({ id: 'outro-item' });

      await expect(
        service.updateMenuItem('menu-1', { name: 'Outro Lanche' }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve atualizar item com sucesso', async () => {
      setupUser();
      mockDb.menuItem.findFirst
        .mockResolvedValueOnce(makeMenuItem())
        .mockResolvedValueOnce(null); // sem duplicidade
      mockDb.menuItem.update.mockResolvedValue(makeMenuItem({ name: 'X-Bacon' }));

      const result = await service.updateMenuItem(
        'menu-1',
        { name: 'X-Bacon' },
        'user-1',
      );

      expect(result.success).toBe(true);
      expect(result.item.name).toBe('X-Bacon');
    });
  });

  // ── deleteMenuItem ─────────────────────────────────────────────────────────
  describe('deleteMenuItem', () => {
    it('lança NotFoundException se item não existir', async () => {
      setupUser();
      mockDb.menuItem.findFirst.mockResolvedValue(null);

      await expect(service.deleteMenuItem('menu-999', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve remover item com sucesso', async () => {
      setupUser();
      mockDb.menuItem.findFirst.mockResolvedValue(makeMenuItem());
      mockDb.menuItem.delete.mockResolvedValue({});

      const result = await service.deleteMenuItem('menu-1', 'user-1');

      expect(result.success).toBe(true);
      expect(mockDb.menuItem.delete).toHaveBeenCalledWith({
        where: { id: 'menu-1' },
      });
    });
  });
});
