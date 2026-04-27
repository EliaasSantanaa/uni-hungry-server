import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class OpenTabDto {
  @ApiPropertyOptional({
    description: 'Observação inicial da comanda (ex: "Sem glúten")',
    example: 'Cliente alérgico a glúten',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Observacao deve ter no maximo 200 caracteres' })
  note?: string;
}
