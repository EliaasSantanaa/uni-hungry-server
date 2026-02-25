// src/module/auth/services/supabase.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private supabase: SupabaseClient;
  private supabaseAdmin: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY');
    const supabaseServiceKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'SUPABASE_URL e SUPABASE_ANON_KEY devem ser configuradas',
      );
    }

    // Cliente normal (para OTP)
    this.supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Cliente admin (para criar usuários)
    if (supabaseServiceKey) {
      this.supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }
  }

  /**
   * Envia OTP usando sistema nativo do Supabase
   */
  async sendOtp(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await this.supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        },
      });

      if (error) {
        this.logger.error(`Erro ao enviar OTP: ${error.message}`);
      } else {
        this.logger.log(`OTP solicitado para: ${email}`);
      }

      return {
        success: true,
        message:
          'Se o email estiver cadastrado, você receberá um código de acesso.',
      };
    } catch (error) {
      this.logger.error(`Erro ao enviar OTP: ${error.message}`);
      return {
        success: true,
        message:
          'Se o email estiver cadastrado, você receberá um código de acesso.',
      };
    }
  }

  /**
   * Verifica OTP usando sistema nativo do Supabase
   */
  async verifyOtp(
    email: string,
    token: string,
  ): Promise<{ success: boolean; session?: any; user?: any }> {
    try {
      const { data, error } = await this.supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });

      if (error) {
        this.logger.error(`Erro ao verificar OTP: ${error.message}`);
        return { success: false };
      }

      this.logger.log(`OTP verificado com sucesso para: ${email}`);

      return {
        success: true,
        session: data.session,
        user: data.user,
      };
    } catch (error) {
      this.logger.error(`Erro ao verificar OTP: ${error.message}`);
      return { success: false };
    }
  }

  /**
   * Cria um usuário no Supabase Auth (Admin API)
   * Retorna o ID do usuário e o link de confirmação
   */
  async createUser(
    email: string,
    password: string,
  ): Promise<{
    success: boolean;
    userId?: string;
    confirmationLink?: string;
    error?: string;
  }> {
    try {
      if (!this.supabaseAdmin) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada');
      }

      // Define a URL de redirecionamento para o backend
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';

      // Cria o usuário com email_confirm: false (não confirmado ainda)
      const { data: userData, error: createError } =
        await this.supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: false, // false = usuário precisa confirmar email
          user_metadata: {
            // Metadados adicionais (opcional)
          },
        });

      if (createError) {
        this.logger.error(`Erro ao criar usuário: ${createError.message}`);
        return { success: false, error: createError.message };
      }

      // Gera link de confirmação
      const { data: linkData, error: linkError } =
        await this.supabaseAdmin.auth.admin.generateLink({
          type: 'signup',
          email,
          password,
          options: {
            redirectTo: `${backendUrl}/auth/confirm`,
          },
        });

      if (linkError) {
        this.logger.error(
          `Erro ao gerar link de confirmação: ${linkError.message}`,
        );
        // Mesmo com erro no link, o usuário foi criado
        return {
          success: true,
          userId: userData.user.id,
          error:
            'Usuário criado mas não foi possível gerar link de confirmação',
        };
      }

      this.logger.log(
        `Usuário criado e link de confirmação gerado para: ${email}`,
      );

      return {
        success: true,
        userId: userData.user.id,
        confirmationLink: linkData.properties.action_link,
      };
    } catch (error) {
      this.logger.error(`Erro ao criar usuário: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Gera um link de confirmação de email para o usuário
   * Útil para reenviar link de confirmação
   */
  async generateEmailConfirmationLink(
    email: string,
    password: string,
  ): Promise<{ success: boolean; link?: string; error?: string }> {
    try {
      if (!this.supabaseAdmin) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada');
      }

      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
      const { data, error } = await this.supabaseAdmin.auth.admin.generateLink({
        type: 'signup',
        email,
        password,
        options: {
          redirectTo: `${backendUrl}/auth/confirm`,
        },
      });

      if (error) {
        this.logger.error(
          `Erro ao gerar link de confirmação: ${error.message}`,
        );
        return { success: false, error: error.message };
      }

      this.logger.log(`Link de confirmação gerado para: ${email}`);

      return {
        success: true,
        link: data.properties.action_link,
      };
    } catch (error) {
      this.logger.error(`Erro ao gerar link de confirmação: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verifica o token de confirmação de email
   */
  async verifyEmailToken(
    tokenHash: string,
    type: string,
  ): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      if (!this.supabaseAdmin) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada');
      }

      // Verifica o token usando o método correto baseado no tipo
      const { data, error } = await this.supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as any,
      });

      if (error) {
        this.logger.error(`Erro ao verificar token de email: ${error.message}`);
        return { success: false, error: error.message };
      }

      this.logger.log(`Email confirmado com sucesso para: ${data.user?.email}`);

      return {
        success: true,
        user: data.user,
      };
    } catch (error) {
      this.logger.error(`Erro ao verificar token de email: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}
