import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({
    description: 'E-mail do usuário que recebeu o código OTP',
    example: 'manager@restaurante.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Código OTP de 6 dígitos enviado por e-mail',
    example: '482931',
    minLength: 6,
    maxLength: 6,
  })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6, { message: 'O código deve ter 6 dígitos' })
  code: string;
}