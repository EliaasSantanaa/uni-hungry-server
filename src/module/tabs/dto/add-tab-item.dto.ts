import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class AddTabItemDto {
  @ApiProperty({
    description: 'UUID do item do cardápio a ser adicionado à comanda',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID('4', { message: 'menuItemId deve ser um UUID valido' })
  @IsNotEmpty({ message: 'ID do item do cardapio e obrigatorio' })
  menuItemId: string;

  @ApiPropertyOptional({
    description: 'Quantidade do item. Padrão: 1',
    example: 2,
    minimum: 1,
  })
  @IsOptional()
  @IsInt({ message: 'Quantidade deve ser inteiro' })
  @Min(1, { message: 'Quantidade minima e 1' })
  quantity?: number;

  @ApiPropertyOptional({
    description: 'Observação específica para este item (ex: "sem cebola")',
    example: 'Sem cebola e sem alho',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Observacao deve ter no maximo 200 caracteres' })
  note?: string;
}
