import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from 'src/database/prisma.service';
import { SupabaseService } from '../auth/services/supabase.service';

const mockDb = {
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

const mockSupabase = {
  setUserActiveStatus: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockDb },
        { provide: SupabaseService, useValue: mockSupabase },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('findAll retorna lista de usuários', async () => {
    mockDb.user.findMany.mockResolvedValue([{ id: '1' }]);
    const result = await service.findAll();
    expect(result.total).toBe(1);
    expect(result.users[0].id).toBe('1');
  });

  it('findOne lança NotFoundException se não achar', async () => {
    mockDb.user.findUnique.mockResolvedValue(null);
    await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
  });

  it('findOne retorna usuário', async () => {
    mockDb.user.findUnique.mockResolvedValue({ id: '1' });
    expect(await service.findOne('1')).toEqual({ id: '1' });
  });

  it('update lança erro se não achar', async () => {
    mockDb.user.findUnique.mockResolvedValue(null);
    await expect(service.update('1', {})).rejects.toThrow(NotFoundException);
  });

  it('update atualiza usuário com sucesso', async () => {
    mockDb.user.findUnique.mockResolvedValue({ id: '1', isActive: true });
    mockDb.user.update.mockResolvedValue({ id: '1', name: 'Updated' });
    expect(await service.update('1', { name: 'Updated' })).toEqual({
      id: '1',
      name: 'Updated',
    });
  });

  it('update sincroniza status no Supabase ao alterar isActive', async () => {
    mockDb.user.findUnique.mockResolvedValue({ id: '1', isActive: true });
    mockSupabase.setUserActiveStatus.mockResolvedValue({ success: true });
    mockDb.user.update.mockResolvedValue({ id: '1', isActive: false });

    await service.update('1', { isActive: false });

    expect(mockSupabase.setUserActiveStatus).toHaveBeenCalledWith('1', false);
    expect(mockDb.user.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: { isActive: false },
    });
  });

  it('update falha se Supabase nao atualizar isActive', async () => {
    mockDb.user.findUnique.mockResolvedValue({ id: '1', isActive: true });
    mockSupabase.setUserActiveStatus.mockResolvedValue({
      success: false,
      error: 'Erro Supabase',
    });

    await expect(service.update('1', { isActive: false })).rejects.toThrow(
      BadRequestException,
    );
    expect(mockDb.user.update).not.toHaveBeenCalled();
  });

  it('remove lança erro se não achar', async () => {
    mockDb.user.findUnique.mockResolvedValue(null);
    await expect(service.remove('1')).rejects.toThrow(NotFoundException);
  });

  it('remove deleta usuário com sucesso', async () => {
    mockDb.user.findUnique.mockResolvedValue({ id: '1' });
    mockDb.user.delete.mockResolvedValue({});
    const result = await service.remove('1');
    expect(result.success).toBe(true);
  });
});
