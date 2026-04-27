import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateRestaurantDto {
  @ApiProperty({
    description: 'Nome do restaurante',
    example: 'Cantina Central',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  name: string;

  @ApiPropertyOptional({
    description: 'CNPJ do restaurante (apenas dígitos ou formatado)',
    example: '12.345.678/0001-90',
  })
  @IsString()
  @IsOptional()
  cnpj?: string;

  @ApiPropertyOptional({
    description: 'Telefone de contato do restaurante',
    example: '(11) 3456-7890',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Endereço do restaurante (logradouro e número)',
    example: 'Av. Universitária, 1000',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    description: 'Cidade do restaurante',
    example: 'São Paulo',
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({
    description: 'Estado (UF)',
    example: 'SP',
  })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({
    description: 'CEP do restaurante',
    example: '05508-010',
  })
  @IsString()
  @IsOptional()
  zipCode?: string;
}
