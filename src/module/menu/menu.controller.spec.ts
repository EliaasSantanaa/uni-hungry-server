import { Test, TestingModule } from '@nestjs/testing';
import { MenuCategory, UserRole } from 'generated/prisma/client';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';

const mockMenuService = {
  listMyMenuItems: jest.fn(),
  createMenuItem: jest.fn(),
  getMenuItemById: jest.fn(),
  updateMenuItem: jest.fn(),
  deleteMenuItem: jest.fn(),
};

const mockUser = { id: 'user-1', email: 'mgr@test.com', role: UserRole.MANAGER };

describe('MenuController', () => {
  let controller: MenuController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MenuController],
      providers: [{ provide: MenuService, useValue: mockMenuService }],
    }).compile();

    controller = module.get<MenuController>(MenuController);
    jest.clearAllMocks();
  });

  describe('listItems', () => {
    it('deve chamar menuService.listMyMenuItems sem categoria', async () => {
      mockMenuService.listMyMenuItems.mockResolvedValue({ success: true });

      await controller.listItems(mockUser as any);

      expect(mockMenuService.listMyMenuItems).toHaveBeenCalledWith('user-1', undefined);
    });

    it('deve chamar menuService.listMyMenuItems com categoria', async () => {
      mockMenuService.listMyMenuItems.mockResolvedValue({ success: true });

      await controller.listItems(mockUser as any, MenuCategory.BEBIDAS);

      expect(mockMenuService.listMyMenuItems).toHaveBeenCalledWith('user-1', MenuCategory.BEBIDAS);
    });
  });

  describe('createItem', () => {
    it('deve chamar menuService.createMenuItem', async () => {
      const dto = { name: 'Coca', price: 5, category: MenuCategory.BEBIDAS };
      mockMenuService.createMenuItem.mockResolvedValue({ success: true });

      await controller.createItem(dto as any, mockUser as any);

      expect(mockMenuService.createMenuItem).toHaveBeenCalledWith(dto, 'user-1');
    });
  });

  describe('getItem', () => {
    it('deve chamar menuService.getMenuItemById', async () => {
      mockMenuService.getMenuItemById.mockResolvedValue({ success: true });

      await controller.getItem('menu-1', mockUser as any);

      expect(mockMenuService.getMenuItemById).toHaveBeenCalledWith('menu-1', 'user-1');
    });
  });

  describe('updateItem', () => {
    it('deve chamar menuService.updateMenuItem', async () => {
      const dto = { price: 6 };
      mockMenuService.updateMenuItem.mockResolvedValue({ success: true });

      await controller.updateItem('menu-1', dto as any, mockUser as any);

      expect(mockMenuService.updateMenuItem).toHaveBeenCalledWith('menu-1', dto, 'user-1');
    });
  });

  describe('removeItem', () => {
    it('deve chamar menuService.deleteMenuItem', async () => {
      mockMenuService.deleteMenuItem.mockResolvedValue({ success: true });

      await controller.removeItem('menu-1', mockUser as any);

      expect(mockMenuService.deleteMenuItem).toHaveBeenCalledWith('menu-1', 'user-1');
    });
  });
});
