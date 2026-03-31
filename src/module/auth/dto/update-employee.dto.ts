import { IsIn, IsOptional, IsString } from 'class-validator';
import { UserRole } from 'generated/prisma/client';

export class UpdateEmployeeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsIn([UserRole.WAITER, UserRole.USER], {
    message: 'Funcao deve ser WAITER ou USER',
  })
  role?: UserRole;
}
