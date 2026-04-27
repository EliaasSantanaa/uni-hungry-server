import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { UserRole } from 'generated/prisma/client';

export class CreateEmployeeDto {
  @ApiProperty({
    description: 'E-mail do funcionário a ser cadastrado',
    example: 'garcom@restaurante.com',
  })
  @IsNotEmpty({ message: 'Email e obrigatorio' })
  @IsEmail({}, { message: 'Email invalido' })
  email: string;

  @ApiPropertyOptional({
    description: 'Nome do funcionário',
    example: 'Carlos Souza',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Telefone do funcionário (com DDD)',
    example: '(11) 98765-4321',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    enum: [UserRole.WAITER, UserRole.USER],
    description: 'Função do funcionário: `WAITER` (garçom) ou `USER`',
    example: UserRole.WAITER,
  })
  @IsNotEmpty({ message: 'Funcao e obrigatoria' })
  @IsIn([UserRole.WAITER, UserRole.USER], {
    message: 'Funcao deve ser WAITER ou USER',
  })
  role: UserRole;
}
