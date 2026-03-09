import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SupabaseService } from './services/supabase.service';
import { ResendModule } from '../resend/resend.module';
import { PrismaModule } from 'src/database/prisma.module';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    ResendModule,
    PrismaModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: {
        expiresIn: '7d', // Token válido por 7 dias
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, SupabaseService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
