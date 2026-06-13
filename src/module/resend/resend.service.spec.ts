import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ResendService } from './resend.service';
import { Resend } from 'resend';

// Mocks the resend package
jest.mock('resend', () => {
  return {
    Resend: jest.fn().mockImplementation(() => ({
      emails: {
        send: jest.fn(),
      },
    })),
  };
});

describe('ResendService', () => {
  let service: ResendService;
  let mockSend: jest.Mock;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key) => {
        if (key === 'RESEND_API_KEY') return 'test-api-key';
        if (key === 'RESEND_FROM') return 'test@domain.com';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResendService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<ResendService>(ResendService);
    mockSend = (service as any).resend.emails.send;
    jest.clearAllMocks();
  });

  describe('sendOtpEmail', () => {
    it('deve retornar false se a API do resend retornar erro', async () => {
      mockSend.mockResolvedValue({ error: { message: 'Erro na API' } });
      const result = await service.sendOtpEmail('test@test.com', '123456');
      expect(result).toBe(false);
    });

    it('deve retornar true em caso de sucesso', async () => {
      mockSend.mockResolvedValue({ data: { id: 'msg_1' } });
      const result = await service.sendOtpEmail('test@test.com', '123456');
      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['test@test.com'],
          html: expect.stringContaining('123456'),
        })
      );
    });
  });

  describe('sendWelcomeEmail', () => {
    it('deve retornar false em caso de erro', async () => {
      mockSend.mockResolvedValue({ error: { message: 'Erro na API' } });
      const result = await service.sendWelcomeEmail('test@test.com', 'João', 'MANAGER');
      expect(result).toBe(false);
    });

    it('deve retornar true em caso de sucesso', async () => {
      mockSend.mockResolvedValue({ data: { id: 'msg_2' } });
      const result = await service.sendWelcomeEmail('test@test.com', 'João', 'MANAGER');
      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['test@test.com'],
          html: expect.stringContaining('João'),
        })
      );
    });
  });
});
