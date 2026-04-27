import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { PaymentMethod } from 'generated/prisma/client';

export class CloseTabDto {
  @ApiProperty({
    enum: PaymentMethod,
    description: 'Forma de pagamento utilizada para fechar a comanda',
    example: PaymentMethod.CREDIT_CARD,
  })
  @IsEnum(PaymentMethod, { message: 'Forma de pagamento invalida' })
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({
    description:
      'Aplicar taxa de serviço (10%) ao total. Padrão: `false`',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'applyServiceCharge deve ser verdadeiro ou falso' })
  applyServiceCharge?: boolean;
}
