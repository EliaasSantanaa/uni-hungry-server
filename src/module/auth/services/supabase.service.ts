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
        const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('SUPABASE_URL e SUPABASE_ANON_KEY devem ser configuradas');
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
                message: 'Se o email estiver cadastrado, você receberá um código de acesso.',
            };
        } catch (error) {
            this.logger.error(`Erro ao enviar OTP: ${error.message}`);
            return {
                success: true,
                message: 'Se o email estiver cadastrado, você receberá um código de acesso.',
            };
        }
    }

    /**
     * Verifica OTP usando sistema nativo do Supabase
     */
    async verifyOtp(email: string, token: string): Promise<{ success: boolean; session?: any; user?: any }> {
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
     * O email de confirmação é enviado automaticamente
     */
    async createUser(email: string, password: string): Promise<{ success: boolean; userId?: string; error?: string }> {
        try {
            if (!this.supabaseAdmin) {
                throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada');
            }

            const { data, error } = await this.supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: false, // false = envia email de confirmação
                // email_confirm: true, // true = confirma automaticamente (sem email)
            });

            if (error) {
                this.logger.error(`Erro ao criar usuário: ${error.message}`);
                return { success: false, error: error.message };
            }

            this.logger.log(`Usuário criado no Supabase Auth: ${email}`);

            return {
                success: true,
                userId: data.user.id,
            };
        } catch (error) {
            this.logger.error(`Erro ao criar usuário: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
}