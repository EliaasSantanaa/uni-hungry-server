import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdatePresenceDto {
  @ApiProperty({ example: -23.55052, description: 'Latitude em graus decimais' })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ example: -46.633308, description: 'Longitude em graus decimais' })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiPropertyOptional({ example: 12.5, description: 'Precisão em metros' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  accuracy?: number;
}
