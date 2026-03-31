import { IsBoolean } from 'class-validator';

export class UpdateEmployeeStatusDto {
  @IsBoolean({ message: 'isActive deve ser true ou false' })
  isActive: boolean;
}
