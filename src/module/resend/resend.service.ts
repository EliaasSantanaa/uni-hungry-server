import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class ResendService {
  private readonly logger = new Logger(ResendService.name);
  private readonly resend: Resend;
  fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    const email = this.configService.get<string>('RESEND_FROM');
    if (!apiKey || !email) {
      throw new Error('Variaveis Resend não configuradas');
    }
    this.fromEmail = email;
    this.resend = new Resend(apiKey);
  }

  async sendOtpEmail(email: string, code: string): Promise<boolean> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: [email],
        subject: 'Seu código de acesso',
        html: this.getOtpEmailTemplate(code),
      });

      if (error) {
        this.logger.error(`Erro ao enviar email: ${error.message}`);
        return false;
      }

      this.logger.log(`Email enviado com sucesso para ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Erro ao enviar email: ${error.message}`);
      return false;
    }
  }

  async sendWelcomeEmail(
    email: string,
    name?: string,
    role?: string,
  ): Promise<boolean> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: [email],
        subject: 'Bem-vindo ao UniHungry! 🎉',
        html: this.getWelcomeEmailTemplate(name, email, role),
      });

      if (error) {
        this.logger.error(
          `Erro ao enviar email de boas-vindas: ${error.message}`,
        );
        return false;
      }

      this.logger.log(`Email de boas-vindas enviado com sucesso para ${email}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Erro ao enviar email de boas-vindas: ${error.message}`,
      );
      return false;
    }
  }

  private getOtpEmailTemplate(code: string): string {
    return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .code { font-size: 32px; font-weight: bold; color: #4F46E5; letter-spacing: 8px; }
                    .footer { margin-top: 20px; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Seu código de acesso</h1>
                    <p>Use o código abaixo para fazer login no Uni Hungry:</p>
                    <div class="code">${code}</div>
                    <p>Este código expira em 5 minutos.</p>
                    <div class="footer">
                        <p>Se você não solicitou este código, ignore este email.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
  }

  private getWelcomeEmailTemplate(
    name?: string,
    email?: string,
    role?: string,
  ): string {
    const roleLabels: Record<string, string> = {
      ADMIN: 'Administrador',
      MANAGER: 'Gerente de Restaurante',
      WAITER: 'Garçom',
      USER: 'Usuário',
    };

    const roleName = role ? roleLabels[role] || role : 'Usuário';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Bem-vindo ao UniHungry</title>
</head>
<body style="margin:0; padding:0; background-color:#000000; font-family:Arial, Helvetica, sans-serif;">
  <table width="100%" cellspacing="0" cellpadding="0" style="background-color:#000000; padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellspacing="0" cellpadding="0" style="background-color:#111111; border-radius:12px; padding:40px; text-align:center;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:20px;">
              <img src="https://rydlqejjkipidadvbgie.supabase.co/storage/v1/object/sign/images/logo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iNmRhOTNlNi1kNGI3LTRhZTQtOTliMy1lMmIzMzI4ZGI2ZTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWFnZXMvbG9nby5wbmciLCJpYXQiOjE3NzEzNDcxNjIsImV4cCI6MTgwMjg4MzE2Mn0.aSj2-VgObQEH7nat2crAePi-8_Mz3gjvDkfSkpOyMC8" 
                   alt="UniHungry"
                   width="200"
                   style="display:block; margin:0 auto;">
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="color:#FFFFFF; font-size:28px; font-weight:bold; padding-bottom:10px;">
              🎉 Bem-vindo ao UniHungry!
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="color:#BBBBBB; font-size:16px; padding-bottom:20px;">
              Olá${name ? ` <span style="color:#1E90FF;">${name}</span>` : ''}!
            </td>
          </tr>

          <!-- Text -->
          <tr>
            <td style="color:#BBBBBB; font-size:15px; padding-bottom:20px; line-height:1.6;">
              Sua conta foi criada com sucesso no <span style="color:#1E90FF; font-weight:bold;">UniHungry</span>.<br/>
              Você foi cadastrado como <span style="color:#1E90FF; font-weight:bold;">${roleName}</span>.
            </td>
          </tr>

          <!-- Info Box -->
          <tr>
            <td style="padding-bottom:30px;">
              <div style="
                background-color:#000000;
                border:1px solid #1E90FF;
                border-radius:10px;
                padding:25px;
                text-align:left;">
                <div style="color:#FFFFFF; font-size:14px; margin-bottom:15px;">
                  <strong style="color:#1E90FF;">📧 Email:</strong><br/>
                  <span style="color:#BBBBBB;">${email || '(não informado)'}</span>
                </div>
                <div style="color:#FFFFFF; font-size:14px;">
                  <strong style="color:#1E90FF;">🔐 Acesso:</strong><br/>
                  <span style="color:#BBBBBB;">Use o login via código OTP enviado por email</span>
                </div>
              </div>
            </td>
          </tr>

          <!-- Instructions -->
          <tr>
            <td style="color:#BBBBBB; font-size:14px; padding-bottom:20px; line-height:1.6;">
              <strong style="color:#FFFFFF;">Como fazer login:</strong><br/>
              1. Acesse o sistema UniHungry<br/>
              2. Digite seu email<br/>
              3. Você receberá um código por email<br/>
              4. Insira o código para acessar sua conta
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding-bottom:30px;">
              <a href="http://localhost:3000/auth/login" 
                 style="
                   display:inline-block;
                   background-color:#1E90FF;
                   color:#FFFFFF;
                   text-decoration:none;
                   font-size:16px;
                   font-weight:bold;
                   padding:14px 40px;
                   border-radius:8px;
                   transition:background-color 0.3s ease;">
                Acessar Sistema
              </a>
            </td>
          </tr>

          <!-- Warning -->
          <tr>
            <td style="color:#777777; font-size:13px; padding-bottom:20px; padding-top:20px; border-top:1px solid #333333;">
              💡 Sua senha é gerenciada automaticamente pelo sistema.<br/>
              Sempre use o login via código OTP para acessar sua conta.
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="color:#555555; font-size:12px; padding-top:20px;">
              Se você não criou esta conta, entre em contato conosco.<br/>
              <br/>
              © ${new Date().getFullYear()} UniHungry. Todos os direitos reservados.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }
}
