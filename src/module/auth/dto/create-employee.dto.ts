import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { UserRole } from 'generated/prisma/client';

export class CreateEmployeeDto {
  @IsNotEmpty({ message: 'Email e obrigatorio' })
  @IsEmail({}, { message: 'Email invalido' })
  email: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsNotEmpty({ message: 'Funcao e obrigatoria' })
  @IsIn([UserRole.WAITER, UserRole.USER], {
    message: 'Funcao deve ser WAITER ou USER',
  })
  role: UserRole;
}
