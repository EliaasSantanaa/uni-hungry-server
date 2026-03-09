import {
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { UserRole } from 'generated/prisma/client';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsUUID()
  restaurantId?: string;
}
