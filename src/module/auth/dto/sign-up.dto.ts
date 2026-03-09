// src/module/auth/dto/sign-up.dto.ts
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
  @IsNotEmpty({ message: 'Email é obrigatório' })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'Role inválida' })
  role?: UserRole;

  @IsOptional()
  @IsUUID()
  @ValidateIf((o) => o.role !== UserRole.ADMIN) // Apenas valida se não for ADMIN
  restaurantId?: string; // FK para Restaurant (obrigatório apenas para MANAGER e WAITER)
}
