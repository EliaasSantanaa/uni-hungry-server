import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TabStatus, TableStatus, UserRole, PaymentMethod } from 'generated/prisma/client';
import { TabsService } from './tabs.service';
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

const makeTable = (overrides = {}) => ({
  id: 'table-1',
  number: 1,
  name: 'Mesa 1',
  capacity: 4,
  status: TableStatus.AVAILABLE,
  restaurantId: 'rest-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const makeTab = (overrides = {}) => ({
  id: 'tab-1',
  tableId: 'table-1',
  status: TabStatus.OPEN,
  totalAmount: { toString: () => '0' },
  subtotal: { toString: () => '0' },
  serviceCharge: { toString: () => '0' },
  paymentMethod: null,
  note: null,
  openedAt: new Date(),
  closedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  items: [],
  table: makeTable(),
  ...overrides,
});

const makeMenuItem = (overrides = {}) => ({
  id: 'menu-item-1',
  name: 'X-Burger',
  description: null,
  price: { toString: () => '25.90' },
  category: 'FOOD',
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
  table: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  tab: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  tabItem: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  menuItem: { findFirst: jest.fn() },
};

// ──────────────────────────────────────────────
// Suite
// ──────────────────────────────────────────────

describe('TabsService', () => {
  let service: TabsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TabsService,
        { provide: PrismaService, useValue: mockDb },
      ],
    }).compile();

    service = module.get<TabsService>(TabsService);
    jest.clearAllMocks();
  });

  // helper para simular usuário autenticado
  const setupUser = (overrides = {}) =>
    mockDb.user.findUnique.mockResolvedValue(makeDbUser(overrides));

  // ── getCurrentUserWithRestaurant (via listTables) ──────────────────────────
  describe('getCurrentUserWithRestaurant (guards)', () => {
    it('lança NotFoundException se usuário não existir', async () => {
      mockDb.user.findUnique.mockResolvedValue(null);
      await expect(service.listTables('user-1')).rejects.toThrow(NotFoundException);
    });

    it('lança ForbiddenException se usuário estiver inativo', async () => {
      setupUser({ isActive: false });
      await expect(service.listTables('user-1')).rejects.toThrow(ForbiddenException);
    });

    it('lança ForbiddenException se usuário for ADMIN', async () => {
      setupUser({ role: UserRole.ADMIN });
      await expect(service.listTables('user-1')).rejects.toThrow(ForbiddenException);
    });

    it('lança ForbiddenException se usuário não tiver restaurante', async () => {
      setupUser({ restaurantId: null });
      await expect(service.listTables('user-1')).rejects.toThrow(ForbiddenException);
    });
  });

  // ── listTables ─────────────────────────────────────────────────────────────
  describe('listTables', () => {
    it('deve retornar lista de mesas com sucesso', async () => {
      setupUser();
      mockDb.table.findMany.mockResolvedValue([makeTable()]);

      const result = await service.listTables('user-1');

      expect(result.success).toBe(true);
      expect(result.total).toBe(1);
      expect(result.tables).toHaveLength(1);
    });
  });

  // ── createTable ────────────────────────────────────────────────────────────
  describe('createTable', () => {
    it('lança BadRequestException se nem number nem name forem informados', async () => {
      setupUser();
      await expect(
        service.createTable({} as any, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve criar mesa com sucesso quando number é fornecido', async () => {
      setupUser();
      const table = makeTable();
      mockDb.table.create.mockResolvedValue(table);

      const result = await service.createTable({ number: 1 } as any, 'user-1');

      expect(result.success).toBe(true);
      expect(result.table.number).toBe(1);
    });
  });

  // ── updateTable ────────────────────────────────────────────────────────────
  describe('updateTable', () => {
    it('lança NotFoundException se mesa não existir', async () => {
      setupUser();
      mockDb.table.findFirst.mockResolvedValue(null);

      await expect(
        service.updateTable('table-999', { number: 2 } as any, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('lança BadRequestException se nenhum campo for informado', async () => {
      setupUser();
      mockDb.table.findFirst.mockResolvedValue(makeTable());

      await expect(
        service.updateTable('table-1', {} as any, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve atualizar mesa com sucesso', async () => {
      setupUser();
      mockDb.table.findFirst.mockResolvedValue(makeTable());
      mockDb.table.update.mockResolvedValue(makeTable({ name: 'Mesa VIP' }));

      const result = await service.updateTable('table-1', { name: 'Mesa VIP' } as any, 'user-1');

      expect(result.success).toBe(true);
    });
  });

  // ── deleteTable ────────────────────────────────────────────────────────────
  describe('deleteTable', () => {
    it('lança NotFoundException se mesa não existir', async () => {
      setupUser();
      mockDb.table.findFirst.mockResolvedValue(null);

      await expect(service.deleteTable('table-999', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lança BadRequestException se mesa tiver comanda aberta', async () => {
      setupUser();
      mockDb.table.findFirst.mockResolvedValue(makeTable());
      mockDb.tab.findFirst.mockResolvedValue(makeTab());

      await expect(service.deleteTable('table-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve deletar mesa com sucesso', async () => {
      setupUser();
      mockDb.table.findFirst.mockResolvedValue(makeTable());
      mockDb.tab.findFirst.mockResolvedValue(null);
      mockDb.table.delete.mockResolvedValue({});

      const result = await service.deleteTable('table-1', 'user-1');

      expect(result.success).toBe(true);
    });
  });

  // ── openTab ────────────────────────────────────────────────────────────────
  describe('openTab', () => {
    it('lança NotFoundException se mesa não existir', async () => {
      setupUser();
      mockDb.table.findFirst.mockResolvedValue(null);

      await expect(
        service.openTab('table-999', {} as any, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('lança BadRequestException se mesa estiver inativa', async () => {
      setupUser();
      mockDb.table.findFirst.mockResolvedValue(makeTable({ status: TableStatus.INACTIVE }));

      await expect(
        service.openTab('table-1', {} as any, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('lança BadRequestException se mesa já tiver comanda aberta', async () => {
      setupUser();
      mockDb.table.findFirst.mockResolvedValue(makeTable());
      mockDb.tab.findFirst.mockResolvedValue(makeTab());

      await expect(
        service.openTab('table-1', {} as any, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve abrir comanda com sucesso', async () => {
      setupUser();
      mockDb.table.findFirst.mockResolvedValue(makeTable());
      mockDb.tab.findFirst.mockResolvedValue(null);
      mockDb.tab.create.mockResolvedValue(makeTab());
      mockDb.table.update.mockResolvedValue({});

      const result = await service.openTab('table-1', {}, 'user-1');

      expect(result.success).toBe(true);
      expect(result.tab).toBeDefined();
    });
  });

  // ── getTabById ─────────────────────────────────────────────────────────────
  describe('getTabById', () => {
    it('lança NotFoundException se comanda não existir', async () => {
      setupUser();
      mockDb.tab.findFirst.mockResolvedValue(null);

      await expect(service.getTabById('tab-999', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lança ForbiddenException se comanda for de outro restaurante', async () => {
      setupUser();
      mockDb.tab.findFirst.mockResolvedValue(
        makeTab({ table: makeTable({ restaurantId: 'outro-rest' }) }),
      );

      await expect(service.getTabById('tab-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('deve retornar comanda com sucesso', async () => {
      setupUser();
      mockDb.tab.findFirst.mockResolvedValue(makeTab());

      const result = await service.getTabById('tab-1', 'user-1');

      expect(result.success).toBe(true);
      expect(result.tab).toBeDefined();
    });
  });

  // ── addItemToTab ───────────────────────────────────────────────────────────
  describe('addItemToTab', () => {
    const dto = { menuItemId: 'menu-item-1', quantity: 2, note: null };

    it('lança NotFoundException se comanda não existir', async () => {
      setupUser();
      mockDb.tab.findFirst.mockResolvedValue(null);

      await expect(
        service.addItemToTab('tab-999', dto as any, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('lança BadRequestException se comanda não estiver aberta', async () => {
      setupUser();
      mockDb.tab.findFirst.mockResolvedValue(
        makeTab({ status: TabStatus.CLOSED }),
      );

      await expect(
        service.addItemToTab('tab-1', dto as any, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('lança NotFoundException se item do cardápio não existir', async () => {
      setupUser();
      mockDb.tab.findFirst.mockResolvedValue(makeTab());
      mockDb.menuItem.findFirst.mockResolvedValue(null);

      await expect(
        service.addItemToTab('tab-1', dto as any, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('lança BadRequestException se item não estiver disponível', async () => {
      setupUser();
      mockDb.tab.findFirst.mockResolvedValue(makeTab());
      mockDb.menuItem.findFirst.mockResolvedValue(makeMenuItem({ isAvailable: false }));

      await expect(
        service.addItemToTab('tab-1', dto as any, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve adicionar item com sucesso e recalcular total', async () => {
      setupUser();
      mockDb.tab.findFirst
        .mockResolvedValueOnce(makeTab()) // busca da comanda
        .mockResolvedValueOnce(makeTab({ totalAmount: { toString: () => '51.80' } })); // após recalcular
      mockDb.menuItem.findFirst.mockResolvedValue(makeMenuItem());
      mockDb.tabItem.create.mockResolvedValue({});
      mockDb.tabItem.findMany.mockResolvedValue([
        { quantity: 2, unitPrice: { toString: () => '25.90' } },
      ]);
      mockDb.tab.update.mockResolvedValue({});

      const result = await service.addItemToTab('tab-1', dto as any, 'user-1');

      expect(result.success).toBe(true);
    });
  });

  // ── removeItemFromTab ──────────────────────────────────────────────────────
  describe('removeItemFromTab', () => {
    it('lança NotFoundException se item não existir na comanda', async () => {
      setupUser();
      mockDb.tab.findFirst.mockResolvedValue(makeTab());
      mockDb.tabItem.findFirst.mockResolvedValue(null);

      await expect(
        service.removeItemFromTab('tab-1', 'item-999', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve remover item com sucesso', async () => {
      setupUser();
      mockDb.tab.findFirst.mockResolvedValue(makeTab());
      mockDb.tabItem.findFirst.mockResolvedValue({ id: 'item-1', tabId: 'tab-1' });
      mockDb.tabItem.delete.mockResolvedValue({});
      mockDb.tabItem.findMany.mockResolvedValue([]);
      mockDb.tab.update.mockResolvedValue({});

      const result = await service.removeItemFromTab('tab-1', 'item-1', 'user-1');

      expect(result.success).toBe(true);
      expect(result.totalAmount).toBe(0);
    });
  });

  // ── closeTab ───────────────────────────────────────────────────────────────
  describe('closeTab', () => {
    const dto = { paymentMethod: PaymentMethod.CREDIT_CARD, applyServiceCharge: true };

    it('lança NotFoundException se comanda não existir', async () => {
      setupUser();
      mockDb.tab.findFirst.mockResolvedValue(null);

      await expect(
        service.closeTab('tab-999', dto as any, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('lança BadRequestException se comanda não estiver aberta', async () => {
      setupUser();
      mockDb.tab.findFirst.mockResolvedValue(makeTab({ status: TabStatus.CLOSED }));

      await expect(
        service.closeTab('tab-1', dto as any, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve fechar comanda com taxa de serviço de 10%', async () => {
      setupUser();
      mockDb.tab.findFirst.mockResolvedValue(makeTab());
      mockDb.tabItem.findMany.mockResolvedValue([
        { quantity: 1, unitPrice: { toString: () => '100' } },
      ]);
      mockDb.tab.update.mockResolvedValue({});
      mockDb.table.update.mockResolvedValue({});

      const result = await service.closeTab('tab-1', dto as any, 'user-1');

      expect(result.success).toBe(true);
      expect(result.serviceCharge).toBe(10);
      expect(result.totalAmount).toBe(110);
    });

    it('deve fechar comanda sem taxa de serviço quando applyServiceCharge=false', async () => {
      setupUser();
      mockDb.tab.findFirst.mockResolvedValue(makeTab());
      mockDb.tabItem.findMany.mockResolvedValue([
        { quantity: 1, unitPrice: { toString: () => '100' } },
      ]);
      mockDb.tab.update.mockResolvedValue({});
      mockDb.table.update.mockResolvedValue({});

      const result = await service.closeTab(
        'tab-1',
        { ...dto, applyServiceCharge: false } as any,
        'user-1',
      );

      expect(result.serviceCharge).toBe(0);
      expect(result.totalAmount).toBe(100);
    });
  });

  // ── cancelTab ──────────────────────────────────────────────────────────────
  describe('cancelTab', () => {
    it('lança NotFoundException se comanda não existir', async () => {
      setupUser();
      mockDb.tab.findFirst.mockResolvedValue(null);

      await expect(service.cancelTab('tab-999', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lança BadRequestException se comanda não estiver aberta', async () => {
      setupUser();
      mockDb.tab.findFirst.mockResolvedValue(makeTab({ status: TabStatus.CANCELLED }));

      await expect(service.cancelTab('tab-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve cancelar comanda com sucesso', async () => {
      setupUser();
      mockDb.tab.findFirst.mockResolvedValue(makeTab());
      mockDb.tab.update.mockResolvedValue({});
      mockDb.table.update.mockResolvedValue({});

      const result = await service.cancelTab('tab-1', 'user-1');

      expect(result.success).toBe(true);
      expect(result.message).toContain('cancelada');
    });
  });

  // ── getTabHistory ──────────────────────────────────────────────────────────
  describe('getTabHistory', () => {
    it('deve retornar histórico com summary correto', async () => {
      setupUser();
      const closedTab = makeTab({
        status: TabStatus.CLOSED,
        totalAmount: { toString: () => '150' },
        subtotal: { toString: () => '150' },
        closedAt: new Date(),
        table: { number: 1, name: 'Mesa 1' },
      });
      const cancelledTab = makeTab({
        status: TabStatus.CANCELLED,
        totalAmount: { toString: () => '0' },
        subtotal: { toString: () => '0' },
        closedAt: new Date(),
        table: { number: 2, name: 'Mesa 2' },
      });
      mockDb.tab.findMany.mockResolvedValue([closedTab, cancelledTab]);

      const result = await service.getTabHistory('user-1', '2025-04-26', 180);

      expect(result.success).toBe(true);
      expect(result.summary.closed).toBe(1);
      expect(result.summary.cancelled).toBe(1);
      expect(result.summary.totalRevenue).toBe(150);
    });
  });
});
