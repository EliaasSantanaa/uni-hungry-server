import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { PaymentMethod } from 'generated/prisma/client';

export class CloseTabDto {
  @IsEnum(PaymentMethod, { message: 'Forma de pagamento invalida' })
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsBoolean({ message: 'applyServiceCharge deve ser verdadeiro ou falso' })
  applyServiceCharge?: boolean;
}
