// src/module/auth/auth.service.ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { SignInDto } from './dto/sign-in.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { SupabaseService } from './services/supabase.service';
import { PrismaService } from 'src/database/prisma.service';
import { SignUpDto } from './dto/sign-up.dto';
import { UserRole } from 'generated/prisma/client';
import { ResendService } from '../resend/resend.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly db: PrismaService,
    private readonly supabaseService: SupabaseService,
    private readonly resendService: ResendService,
  ) {}

  async signIn(signInDto: SignInDto) {
    return this.supabaseService.sendOtp(signInDto.email);
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const result = await this.supabaseService.verifyOtp(
      verifyOtpDto.email,
      verifyOtpDto.code,
    );

    if (!result.success) {
      throw new UnauthorizedException('Código inválido ou expirado');
    }

    return {
      success: true,
      message: 'Login realizado com sucesso',
      session: result.session,
    };
  }

  async signUp(signUpDto: SignUpDto) {
    const { email, password, name, phone, role } = signUpDto;

    // Verifica se já existe
    const existingUser = await this.db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }

    // 1. Criar no Supabase Auth e gerar link de confirmação
    const supabaseResult = await this.supabaseService.createUser(
      email,
      password,
    );

    if (!supabaseResult.success) {
      throw new BadRequestException(
        supabaseResult.error || 'Erro ao criar usuário',
      );
    }

    // 2. Criar na nossa tabela users
    const user = await this.db.user.create({
      data: {
        id: supabaseResult.userId!, // Mesmo ID do Supabase
        email,
        name,
        phone,
        role: role || UserRole.USER, // Role customizada (padrão: USER)
      },
    });

    // 3. Enviar email de confirmação via Resend
    if (supabaseResult.confirmationLink) {
      const emailSent = await this.resendService.sendConfirmationEmail(
        email,
        supabaseResult.confirmationLink,
        name,
      );

      if (!emailSent) {
        this.logger.warn(
          `Não foi possível enviar email de confirmação para: ${email}`,
        );
      }
    }

    return {
      success: true,
      message:
        'Usuário criado com sucesso. Verifique seu email para confirmar.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async confirmEmail(tokenHash: string, type: string) {
    const result = await this.supabaseService.verifyEmailToken(tokenHash, type);

    if (!result.success) {
      throw new BadRequestException(
        result.error || 'Token inválido ou expirado',
      );
    }

    return {
      success: true,
      message: 'Email confirmado com sucesso! Você já pode fazer login.',
    };
  }
}
