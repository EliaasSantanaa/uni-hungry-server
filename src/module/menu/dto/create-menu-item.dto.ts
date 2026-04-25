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
  @IsString()
  @IsNotEmpty({ message: 'Nome do produto e obrigatorio' })
  @MaxLength(120, { message: 'Nome deve ter no maximo 120 caracteres' })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(300, { message: 'Descricao deve ter no maximo 300 caracteres' })
  description?: string;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Preco deve ser um numero valido com ate 2 casas decimais' },
  )
  @Min(0.01, { message: 'Preco deve ser maior que zero' })
  price: number;

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

  @IsOptional()
  @IsBoolean({ message: 'isAvailable deve ser verdadeiro ou falso' })
  isAvailable?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500, {
    message: 'URL da imagem deve ter no maximo 500 caracteres',
  })
  imageUrl?: string;
}
