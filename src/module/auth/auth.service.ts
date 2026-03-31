// src/module/auth/auth.service.ts
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
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
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeStatusDto } from './dto/update-employee-status.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
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

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private normalizeOptional(value?: string): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private async getCurrentUserWithRestaurant(userId: string) {
    const currentUser = await this.db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        isActive: true,
        restaurantId: true,
      },
    });

    if (!currentUser) {
      throw new NotFoundException('Usuario logado nao encontrado');
    }

    if (!currentUser.isActive) {
      throw new ForbiddenException(
        'Usuario inativo nao pode gerenciar funcionarios',
      );
    }

    if (!currentUser.restaurantId) {
      throw new ForbiddenException(
        'Voce precisa de restaurante vinculado para gerenciar funcionarios',
      );
    }

    return currentUser;
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
    // if (user.role !== UserRole.ADMIN) {
    //   throw new UnauthorizedException(
    //     'Acesso restrito apenas para administradores',
    //   );
    // }

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
    const { name, phone, role, restaurantId } = signUpDto;
    const email = this.normalizeEmail(signUpDto.email);

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
        name: this.normalizeOptional(name),
        phone: this.normalizeOptional(phone),
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

  async listMyEmployees(currentUserId: string) {
    const currentUser = await this.getCurrentUserWithRestaurant(currentUserId);

    const employees = await this.db.user.findMany({
      where: {
        restaurantId: currentUser.restaurantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        restaurantId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      total: employees.length,
      employees,
    };
  }

  async createEmployee(
    createEmployeeDto: CreateEmployeeDto,
    currentUserId: string,
  ) {
    const currentUser = await this.getCurrentUserWithRestaurant(currentUserId);
    const email = this.normalizeEmail(createEmployeeDto.email);

    if (
      createEmployeeDto.role !== UserRole.WAITER &&
      createEmployeeDto.role !== UserRole.USER
    ) {
      throw new BadRequestException('Funcao permitida apenas: WAITER ou USER');
    }

    const existingUser = await this.db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email ja cadastrado');
    }

    const randomPassword = this.generateRandomPassword();
    const supabaseResult = await this.supabaseService.createUser(
      email,
      randomPassword,
    );

    if (!supabaseResult.success || !supabaseResult.userId) {
      throw new BadRequestException(
        supabaseResult.error || 'Erro ao criar funcionario',
      );
    }

    const employee = await this.db.user.create({
      data: {
        id: supabaseResult.userId,
        email,
        name: this.normalizeOptional(createEmployeeDto.name),
        phone: this.normalizeOptional(createEmployeeDto.phone),
        role: createEmployeeDto.role,
        isActive: true,
        restaurantId: currentUser.restaurantId,
      },
    });

    try {
      await this.resendService.sendWelcomeEmail(
        employee.email,
        employee.name || undefined,
        employee.role,
      );
    } catch (error) {
      this.logger.warn(
        `Falha ao enviar email de boas-vindas para ${employee.email}: ${error.message}`,
      );
    }

    return {
      success: true,
      message: 'Funcionario criado com sucesso',
      employee,
    };
  }

  async updateEmployeeStatus(
    employeeId: string,
    updateEmployeeStatusDto: UpdateEmployeeStatusDto,
    currentUserId: string,
  ) {
    const currentUser = await this.getCurrentUserWithRestaurant(currentUserId);

    const employee = await this.db.user.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException('Funcionario nao encontrado');
    }

    if (employee.restaurantId !== currentUser.restaurantId) {
      throw new ForbiddenException(
        'Voce nao pode alterar funcionario de outro restaurante',
      );
    }

    if (employee.id === currentUser.id) {
      throw new BadRequestException(
        'Nao e permitido alterar seu proprio status por este endpoint',
      );
    }

    const isActive = updateEmployeeStatusDto.isActive;
    const supabaseResult = await this.supabaseService.setUserActiveStatus(
      employee.id,
      isActive,
    );

    if (!supabaseResult.success) {
      throw new BadRequestException(
        supabaseResult.error || 'Nao foi possivel atualizar status no Supabase',
      );
    }

    const updatedEmployee = await this.db.user.update({
      where: { id: employeeId },
      data: {
        isActive,
      },
    });

    return {
      success: true,
      message: isActive
        ? 'Funcionario ativado com sucesso'
        : 'Funcionario inativado com sucesso',
      employee: updatedEmployee,
    };
  }

  async updateEmployee(
    employeeId: string,
    updateEmployeeDto: UpdateEmployeeDto,
    currentUserId: string,
  ) {
    const currentUser = await this.getCurrentUserWithRestaurant(currentUserId);

    const employee = await this.db.user.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException('Funcionario nao encontrado');
    }

    if (employee.restaurantId !== currentUser.restaurantId) {
      throw new ForbiddenException(
        'Voce nao pode editar funcionario de outro restaurante',
      );
    }

    const dataToUpdate: {
      name?: string | null;
      phone?: string | null;
      role?: UserRole;
    } = {};

    if (Object.prototype.hasOwnProperty.call(updateEmployeeDto, 'name')) {
      dataToUpdate.name = this.normalizeOptional(updateEmployeeDto.name);
    }

    if (Object.prototype.hasOwnProperty.call(updateEmployeeDto, 'phone')) {
      dataToUpdate.phone = this.normalizeOptional(updateEmployeeDto.phone);
    }

    if (updateEmployeeDto.role) {
      if (
        updateEmployeeDto.role !== UserRole.WAITER &&
        updateEmployeeDto.role !== UserRole.USER
      ) {
        throw new BadRequestException(
          'Funcao permitida apenas: WAITER ou USER',
        );
      }

      dataToUpdate.role = updateEmployeeDto.role;
    }

    if (!Object.keys(dataToUpdate).length) {
      throw new BadRequestException(
        'Nenhum campo valido informado para atualizacao',
      );
    }

    const updatedEmployee = await this.db.user.update({
      where: { id: employeeId },
      data: dataToUpdate,
    });

    return {
      success: true,
      message: 'Funcionario atualizado com sucesso',
      employee: updatedEmployee,
    };
  }
}
