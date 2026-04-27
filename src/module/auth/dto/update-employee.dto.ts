import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { UserRole } from 'generated/prisma/client';

export class UpdateEmployeeDto {
  @ApiPropertyOptional({
    description: 'Novo nome do funcionário',
    example: 'Carlos Souza',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Novo telefone do funcionário',
    example: '(11) 98765-4321',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    enum: [UserRole.WAITER, UserRole.USER],
    description: 'Nova função do funcionário',
    example: UserRole.WAITER,
  })
  @IsOptional()
  @IsIn([UserRole.WAITER, UserRole.USER], {
    message: 'Funcao deve ser WAITER ou USER',
  })
  role?: UserRole;
}
