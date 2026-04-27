import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateTableDto {
  @ApiPropertyOptional({
    description: 'Número identificador da mesa',
    example: 5,
    minimum: 1,
  })
  @IsOptional()
  @IsInt({ message: 'Numero da mesa deve ser inteiro' })
  @Min(1, { message: 'Numero da mesa deve ser maior que zero' })
  number?: number;

  @ApiPropertyOptional({
    description: 'Nome personalizado para a mesa (ex: "Varanda", "VIP 1")',
    example: 'Varanda',
    maxLength: 80,
  })
  @IsOptional()
  @IsString()
  @MaxLength(80, { message: 'Nome deve ter no maximo 80 caracteres' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Capacidade máxima de pessoas na mesa',
    example: 4,
    minimum: 1,
  })
  @IsOptional()
  @IsInt({ message: 'Capacidade deve ser inteiro' })
  @Min(1, { message: 'Capacidade deve ser maior que zero' })
  capacity?: number;
}
