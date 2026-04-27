import { Test, TestingModule } from '@nestjs/testing';
import { PaymentMethod, TabStatus, UserRole } from 'generated/prisma/client';
import { TabsController } from './tabs.controller';
import { TabsService } from './tabs.service';

// ──────────────────────────────────────────────
// Mock do TabsService
// ──────────────────────────────────────────────

const mockTabsService = {
  getTabHistory: jest.fn(),
  listTables: jest.fn(),
  createTable: jest.fn(),
  updateTable: jest.fn(),
  deleteTable: jest.fn(),
  getActiveTabForTable: jest.fn(),
  openTab: jest.fn(),
  getTabById: jest.fn(),
  addItemToTab: jest.fn(),
  removeItemFromTab: jest.fn(),
  closeTab: jest.fn(),
  cancelTab: jest.fn(),
};

const mockUser = { id: 'user-1', email: 'mgr@test.com', role: UserRole.MANAGER };

describe('TabsController', () => {
  let controller: TabsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TabsController],
      providers: [{ provide: TabsService, useValue: mockTabsService }],
    }).compile();

    controller = module.get<TabsController>(TabsController);
    jest.clearAllMocks();
  });

  // ── getTabHistory ──────────────────────────────────────────────────────────
  describe('getTabHistory', () => {
    it('deve chamar tabsService.getTabHistory com parâmetros corretos', async () => {
      mockTabsService.getTabHistory.mockResolvedValue({ success: true });

      await controller.getTabHistory('2025-04-26', '-180', mockUser as any);

      expect(mockTabsService.getTabHistory).toHaveBeenCalledWith('user-1', '2025-04-26', -180);
    });

    it('deve usar offset 0 quando tz não for fornecido', async () => {
      mockTabsService.getTabHistory.mockResolvedValue({ success: true });

      await controller.getTabHistory('2025-04-26', undefined as any, mockUser as any);

      expect(mockTabsService.getTabHistory).toHaveBeenCalledWith('user-1', '2025-04-26', 0);
    });
  });

  // ── listTables ─────────────────────────────────────────────────────────────
  describe('listTables', () => {
    it('deve chamar tabsService.listTables com userId', async () => {
      const serviceResult = { success: true, total: 0, tables: [] };
      mockTabsService.listTables.mockResolvedValue(serviceResult);

      const result = await controller.listTables(mockUser as any);

      expect(mockTabsService.listTables).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(serviceResult);
    });
  });

  // ── createTable ────────────────────────────────────────────────────────────
  describe('createTable', () => {
    it('deve chamar tabsService.createTable com dto e userId', async () => {
      const dto = { number: 5 };
      const serviceResult = { success: true, table: {} };
      mockTabsService.createTable.mockResolvedValue(serviceResult);

      const result = await controller.createTable(dto as any, mockUser as any);

      expect(mockTabsService.createTable).toHaveBeenCalledWith(dto, 'user-1');
      expect(result).toEqual(serviceResult);
    });
  });

  // ── updateTable ────────────────────────────────────────────────────────────
  describe('updateTable', () => {
    it('deve chamar tabsService.updateTable com tableId, dto e userId', async () => {
      const dto = { name: 'Mesa VIP' };
      const serviceResult = { success: true, table: {} };
      mockTabsService.updateTable.mockResolvedValue(serviceResult);

      const result = await controller.updateTable('table-1', dto as any, mockUser as any);

      expect(mockTabsService.updateTable).toHaveBeenCalledWith('table-1', dto, 'user-1');
      expect(result).toEqual(serviceResult);
    });
  });

  // ── deleteTable ────────────────────────────────────────────────────────────
  describe('deleteTable', () => {
    it('deve chamar tabsService.deleteTable com tableId e userId', async () => {
      const serviceResult = { success: true, message: 'Mesa removida' };
      mockTabsService.deleteTable.mockResolvedValue(serviceResult);

      const result = await controller.deleteTable('table-1', mockUser as any);

      expect(mockTabsService.deleteTable).toHaveBeenCalledWith('table-1', 'user-1');
      expect(result).toEqual(serviceResult);
    });
  });

  // ── getActiveTabForTable ───────────────────────────────────────────────────
  describe('getActiveTabForTable', () => {
    it('deve chamar tabsService.getActiveTabForTable com tableId e userId', async () => {
      const serviceResult = { success: true, table: {}, tab: null };
      mockTabsService.getActiveTabForTable.mockResolvedValue(serviceResult);

      const result = await controller.getActiveTabForTable('table-1', mockUser as any);

      expect(mockTabsService.getActiveTabForTable).toHaveBeenCalledWith('table-1', 'user-1');
      expect(result).toEqual(serviceResult);
    });
  });

  // ── openTab ────────────────────────────────────────────────────────────────
  describe('openTab', () => {
    it('deve chamar tabsService.openTab com tableId, dto e userId', async () => {
      const dto = { note: 'Mesa reservada' };
      const serviceResult = { success: true, tab: {} };
      mockTabsService.openTab.mockResolvedValue(serviceResult);

      const result = await controller.openTab('table-1', dto as any, mockUser as any);

      expect(mockTabsService.openTab).toHaveBeenCalledWith('table-1', dto, 'user-1');
      expect(result).toEqual(serviceResult);
    });
  });

  // ── getTabById ─────────────────────────────────────────────────────────────
  describe('getTabById', () => {
    it('deve chamar tabsService.getTabById com tabId e userId', async () => {
      const serviceResult = { success: true, tab: {} };
      mockTabsService.getTabById.mockResolvedValue(serviceResult);

      const result = await controller.getTabById('tab-1', mockUser as any);

      expect(mockTabsService.getTabById).toHaveBeenCalledWith('tab-1', 'user-1');
      expect(result).toEqual(serviceResult);
    });
  });

  // ── addItemToTab ───────────────────────────────────────────────────────────
  describe('addItemToTab', () => {
    it('deve chamar tabsService.addItemToTab com tabId, dto e userId', async () => {
      const dto = { menuItemId: 'menu-1', quantity: 2 };
      const serviceResult = { success: true, tab: {} };
      mockTabsService.addItemToTab.mockResolvedValue(serviceResult);

      const result = await controller.addItemToTab('tab-1', dto as any, mockUser as any);

      expect(mockTabsService.addItemToTab).toHaveBeenCalledWith('tab-1', dto, 'user-1');
      expect(result).toEqual(serviceResult);
    });
  });

  // ── removeItemFromTab ──────────────────────────────────────────────────────
  describe('removeItemFromTab', () => {
    it('deve chamar tabsService.removeItemFromTab com tabId, itemId e userId', async () => {
      const serviceResult = { success: true, totalAmount: 0 };
      mockTabsService.removeItemFromTab.mockResolvedValue(serviceResult);

      const result = await controller.removeItemFromTab('tab-1', 'item-1', mockUser as any);

      expect(mockTabsService.removeItemFromTab).toHaveBeenCalledWith('tab-1', 'item-1', 'user-1');
      expect(result).toEqual(serviceResult);
    });
  });

  // ── closeTab ───────────────────────────────────────────────────────────────
  describe('closeTab', () => {
    it('deve chamar tabsService.closeTab com tabId, dto e userId', async () => {
      const dto = { paymentMethod: PaymentMethod.CREDIT_CARD, applyServiceCharge: true };
      const serviceResult = {
        success: true,
        subtotal: 100,
        serviceCharge: 10,
        totalAmount: 110,
      };
      mockTabsService.closeTab.mockResolvedValue(serviceResult);

      const result = await controller.closeTab('tab-1', dto as any, mockUser as any);

      expect(mockTabsService.closeTab).toHaveBeenCalledWith('tab-1', dto, 'user-1');
      expect(result).toEqual(serviceResult);
    });
  });

  // ── cancelTab ──────────────────────────────────────────────────────────────
  describe('cancelTab', () => {
    it('deve chamar tabsService.cancelTab com tabId e userId', async () => {
      const serviceResult = { success: true, message: 'Comanda cancelada' };
      mockTabsService.cancelTab.mockResolvedValue(serviceResult);

      const result = await controller.cancelTab('tab-1', mockUser as any);

      expect(mockTabsService.cancelTab).toHaveBeenCalledWith('tab-1', 'user-1');
      expect(result).toEqual(serviceResult);
    });
  });
});
