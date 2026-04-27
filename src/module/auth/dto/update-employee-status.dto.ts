import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateEmployeeStatusDto {
  @ApiProperty({
    description: 'Define se o funcionário está ativo (`true`) ou inativo (`false`)',
    example: true,
  })
  @IsBoolean({ message: 'isActive deve ser true ou false' })
  isActive: boolean;
}
