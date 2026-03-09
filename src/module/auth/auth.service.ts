// src/module/auth/auth.service.ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SignInDto } from './dto/sign-in.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { SupabaseService } from './services/supabase.service';
import { PrismaService } from 'src/database/prisma.service';
import { SignUpDto } from './dto/sign-up.dto';
import { UserRole } from 'generated/prisma/client';
import { ResendService } from '../resend/resend.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly db: PrismaService,
    private readonly supabaseService: SupabaseService,
    private readonly resendService: ResendService,
    private readonly jwtService: JwtService,
  ) {}

  // Gera senha aleatória segura
  private generateRandomPassword(): string {
    return crypto.randomBytes(32).toString('hex');
  }

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

    // Busca o usuário no nosso banco
    const user = await this.db.user.findUnique({
      where: { email: verifyOtpDto.email },
      include: { restaurant: true },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    // Apenas ADMIN pode acessar o sistema admin
    if (user.role !== UserRole.ADMIN) {
      throw new UnauthorizedException(
        'Acesso restrito apenas para administradores',
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Usuário inativo');
    }

    // Gera JWT token
    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload);

    return {
      success: true,
      message: 'Login realizado com sucesso',
      access_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        restaurantId: user.restaurantId,
        restaurant: user.restaurant,
      },
    };
  }

  async signUp(signUpDto: SignUpDto) {
    const { email, name, phone, role, restaurantId } = signUpDto;

    // Verifica se já existe
    const existingUser = await this.db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }

    // Gera senha aleatória automaticamente
    const randomPassword = this.generateRandomPassword();

    // 1. Criar no Supabase Auth (com email já confirmado)
    const supabaseResult = await this.supabaseService.createUser(
      email,
      randomPassword,
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
        role: role || UserRole.MANAGER,
        restaurantId: restaurantId || null,
      },
    });

    // 3. Enviar email de boas-vindas via Resend
    try {
      await this.resendService.sendWelcomeEmail(email, name, user.role);
      this.logger.log(`Email de boas-vindas enviado com sucesso para ${email}`);
    } catch (error) {
      this.logger.warn(
        `Não foi possível enviar email de boas-vindas para ${email}: ${error.message}`,
      );
      // Não falha a criação do usuário se o email falhar
    }

    this.logger.log(`Usuário criado com sucesso: ${email} (${user.role})`);

    return {
      success: true,
      message:
        'Cliente criado com sucesso. Um email de boas-vindas foi enviado.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        restaurantId: user.restaurantId,
      },
    };
  }
}
