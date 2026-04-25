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
  @IsUUID('4', { message: 'menuItemId deve ser um UUID valido' })
  @IsNotEmpty({ message: 'ID do item do cardapio e obrigatorio' })
  menuItemId: string;

  @IsOptional()
  @IsInt({ message: 'Quantidade deve ser inteiro' })
  @Min(1, { message: 'Quantidade minima e 1' })
  quantity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Observacao deve ter no maximo 200 caracteres' })
  note?: string;
}
