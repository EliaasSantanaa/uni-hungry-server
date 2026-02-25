import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SupabaseService } from './services/supabase.service';
import { ResendModule } from '../resend/resend.module';

@Module({
  imports: [ResendModule],
  controllers: [AuthController],
  providers: [AuthService, SupabaseService],
  exports: [AuthService],
})
export class AuthModule {}
