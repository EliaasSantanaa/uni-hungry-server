import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateTableDto {
  @IsOptional()
  @IsInt({ message: 'Numero da mesa deve ser inteiro' })
  @Min(1, { message: 'Numero da mesa deve ser maior que zero' })
  number?: number;

  @IsOptional()
  @IsString()
  @MaxLength(80, { message: 'Nome deve ter no maximo 80 caracteres' })
  name?: string;

  @IsOptional()
  @IsInt({ message: 'Capacidade deve ser inteiro' })
  @Min(1, { message: 'Capacidade deve ser maior que zero' })
  capacity?: number;
}
