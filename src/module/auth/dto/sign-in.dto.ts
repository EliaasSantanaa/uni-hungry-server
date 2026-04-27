import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class SignInDto {
  @ApiProperty({
    description: 'E-mail do usuário cadastrado no sistema',
    example: 'manager@restaurante.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}