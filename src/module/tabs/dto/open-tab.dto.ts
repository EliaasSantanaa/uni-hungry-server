import { IsOptional, IsString, MaxLength } from 'class-validator';

export class OpenTabDto {
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Observacao deve ter no maximo 200 caracteres' })
  note?: string;
}
