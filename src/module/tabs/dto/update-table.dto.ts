import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { TableStatus } from 'generated/prisma/client';
import { CreateTableDto } from './create-table.dto';

export class UpdateTableDto extends PartialType(CreateTableDto) {
  @IsOptional()
  @IsEnum(TableStatus, { message: 'Status da mesa invalido' })
  status?: TableStatus;
}
