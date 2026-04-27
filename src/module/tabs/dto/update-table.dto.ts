import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { TableStatus } from 'generated/prisma/client';
import { CreateTableDto } from './create-table.dto';

export class UpdateTableDto extends PartialType(CreateTableDto) {
  @ApiPropertyOptional({
    enum: TableStatus,
    description: 'Status atual da mesa',
    example: TableStatus.AVAILABLE,
  })
  @IsOptional()
  @IsEnum(TableStatus, { message: 'Status da mesa invalido' })
  status?: TableStatus;
}
