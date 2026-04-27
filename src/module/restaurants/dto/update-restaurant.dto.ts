import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';
import { CreateRestaurantDto } from './create-restaurant.dto';

export class UpdateRestaurantDto extends PartialType(CreateRestaurantDto) {
  @ApiPropertyOptional({
    description: 'Define se o restaurante está ativo ou inativo',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
