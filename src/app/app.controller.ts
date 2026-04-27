import { Controller, Get } from '@nestjs/common';
import { AppService, HealthStatus } from './app.service';
import {
  ApiOperation,
  ApiOkResponse,
  ApiTags,
  ApiProperty,
} from '@nestjs/swagger';

class DatabaseStatusDto {
  @ApiProperty({
    enum: ['connected', 'disconnected'],
    description: 'Estado da conexão com o banco de dados',
  })
  status: 'connected' | 'disconnected';

  @ApiProperty({
    required: false,
    description: 'Latência da consulta ao banco em milissegundos',
    example: 12,
  })
  latencyMs?: number;

  @ApiProperty({
    required: false,
    description: 'Mensagem de erro caso o banco esteja inacessível',
  })
  error?: string;
}

class HealthResponseDto {
  @ApiProperty({
    enum: ['ok', 'error'],
    description: 'Status geral da aplicação',
    example: 'ok',
  })
  status: 'ok' | 'error';

  @ApiProperty({
    description: 'Data e hora da consulta em formato ISO 8601',
    example: '2025-04-26T20:00:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Tempo de atividade do processo em segundos',
    example: 3600,
  })
  uptime: number;

  @ApiProperty({
    description: 'Versão da API',
    example: '1.0.0',
  })
  version: string;

  @ApiProperty({ type: DatabaseStatusDto })
  database: DatabaseStatusDto;

  @ApiProperty({
    description: 'Ambiente de execução',
    example: 'production',
  })
  environment: string;
}

@ApiTags('Status')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Health check da API',
    description:
      'Verifica se a aplicação está no ar e retorna o status da conexão com o banco de dados, uptime, versão e ambiente.',
  })
  @ApiOkResponse({
    description: 'Aplicação operacional',
    type: HealthResponseDto,
  })
  async getHealth(): Promise<HealthStatus> {
    return this.appService.getHealth();
  }
}
