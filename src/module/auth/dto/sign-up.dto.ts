// src/module/auth/dto/sign-up.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { UserRole } from 'generated/prisma/client';

export class SignUpDto {
  @ApiProperty({
    description: 'E-mail do usuário (único no sistema)',
    example: 'novo@restaurante.com',
  })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @ApiPropertyOptional({
    description: 'Nome completo do usuário',
    example: 'João Silva',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Telefone do usuário (com DDD)',
    example: '(11) 91234-5678',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    enum: UserRole,
    description: 'Perfil de acesso. Padrão: `MANAGER`',
    example: UserRole.MANAGER,
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Role inválida' })
  role?: UserRole;

  @ApiPropertyOptional({
    description:
      'ID do restaurante ao qual o usuário será vinculado (obrigatório para MANAGER e WAITER)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  @ValidateIf((o) => o.role !== UserRole.ADMIN)
  restaurantId?: string;
}
