import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MenuCategory } from 'generated/prisma/client';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateMenuItemDto {
  @ApiProperty({
    description: 'Nome do item do cardápio',
    example: 'Frango Grelhado',
    maxLength: 120,
  })
  @IsString()
  @IsNotEmpty({ message: 'Nome do produto e obrigatorio' })
  @MaxLength(120, { message: 'Nome deve ter no maximo 120 caracteres' })
  name: string;

  @ApiPropertyOptional({
    description: 'Descrição detalhada do item',
    example: 'Frango grelhado com ervas finas, acompanha arroz e salada',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @MaxLength(300, { message: 'Descricao deve ter no maximo 300 caracteres' })
  description?: string;

  @ApiProperty({
    description: 'Preço unitário do item em reais',
    example: 18.9,
    minimum: 0.01,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Preco deve ser um numero valido com ate 2 casas decimais' },
  )
  @Min(0.01, { message: 'Preco deve ser maior que zero' })
  price: number;

  @ApiProperty({
    enum: MenuCategory,
    description: 'Categoria do item no cardápio',
    example: MenuCategory.PRATO_PRINCIPAL,
  })
  @IsNotEmpty({ message: 'Categoria e obrigatoria' })
  @IsIn(
    [
      MenuCategory.BEBIDAS,
      MenuCategory.SOBREMESAS,
      MenuCategory.PRATO_PRINCIPAL,
      MenuCategory.ENTRADAS,
      MenuCategory.ACOMPANHAMENTOS,
    ],
    { message: 'Categoria invalida para item do cardapio' },
  )
  category: MenuCategory;

  @ApiPropertyOptional({
    description: 'Indica se o item está disponível para pedido. Padrão: `true`',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'isAvailable deve ser verdadeiro ou falso' })
  isAvailable?: boolean;

  @ApiPropertyOptional({
    description: 'URL pública da imagem do item',
    example: 'https://cdn.exemplo.com/frango.jpg',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, {
    message: 'URL da imagem deve ter no maximo 500 caracteres',
  })
  imageUrl?: string;
}
