import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

const LOGO_URL =
  'https://rydlqejjkipidadvbgie.supabase.co/storage/v1/object/sign/images/logo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iNmRhOTNlNi1kNGI3LTRhZTQtOTliMy1lMmIzMzI4ZGI2ZTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWFnZXMvbG9nby5wbmciLCJpYXQiOjE3NzEzNDcxNjIsImV4cCI6MTgwMjg4MzE2Mn0.aSj2-VgObQEH7nat2crAePi-8_Mz3gjvDkfSkpOyMC8';

@Injectable()
export class ResendService {
  private readonly logger = new Logger(ResendService.name);
  private readonly resend: Resend;
  fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    const email = this.configService.get<string>('RESEND_FROM');
    if (!apiKey || !email) {
      throw new Error('Variáveis Resend não configuradas');
    }
    this.fromEmail = email;
    this.resend = new Resend(apiKey);
  }

  // ── Normaliza e-mail: remove espaços e converte para minúsculas ──────────
  normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  async sendOtpEmail(email: string, code: string): Promise<boolean> {
    const normalizedEmail = this.normalizeEmail(email);
    try {
      const { error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: [normalizedEmail],
        subject: 'Seu código de acesso — UniHungry',
        html: this.getOtpEmailTemplate(code),
      });

      if (error) {
        this.logger.error(`Erro ao enviar e-mail: ${error.message}`);
        return false;
      }

      this.logger.log(`E-mail enviado com sucesso para ${normalizedEmail}`);
      return true;
    } catch (error) {
      this.logger.error(`Erro ao enviar e-mail: ${error.message}`);
      return false;
    }
  }

  async sendWelcomeEmail(
    email: string,
    name?: string,
    role?: string,
  ): Promise<boolean> {
    const normalizedEmail = this.normalizeEmail(email);
    try {
      const { error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: [normalizedEmail],
        subject: 'Bem-vindo ao UniHungry! 🎉',
        html: this.getWelcomeEmailTemplate(name, normalizedEmail, role),
      });

      if (error) {
        this.logger.error(
          `Erro ao enviar e-mail de boas-vindas: ${error.message}`,
        );
        return false;
      }

      this.logger.log(
        `E-mail de boas-vindas enviado com sucesso para ${normalizedEmail}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Erro ao enviar e-mail de boas-vindas: ${error.message}`,
      );
      return false;
    }
  }

  async sendVotingEmail(email: string, name: string): Promise<boolean> {
    const normalizedEmail = this.normalizeEmail(email);
    try {
      const { error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: [normalizedEmail],
        subject: `${name}, o UniHungry precisa de você`,
        text: this.getVotingEmailPlainText(name),
        html: this.getVotingEmailTemplate(name),
        headers: {
          'X-Priority': '3',
          'X-Mailer': 'UniHungry',
        },
      });

      if (error) {
        this.logger.error(`Erro ao enviar e-mail de votação: ${error.message}`);
        return false;
      }

      this.logger.log(
        `E-mail de votação enviado com sucesso para ${normalizedEmail}`,
      );
      return true;
    } catch (error) {
      this.logger.error(`Erro ao enviar e-mail de votação: ${error.message}`);
      return false;
    }
  }

  // ── Templates ─────────────────────────────────────────────────────────────

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
        <p>Use o código abaixo para fazer login no UniHungry:</p>
        <div class="code">${code}</div>
        <p>Este código expira em 5 minutos.</p>
        <div class="footer">
            <p>Se você não solicitou este código, ignore este e-mail.</p>
        </div>
    </div>
</body>
</html>`;
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
              <img src="${LOGO_URL}" alt="UniHungry" width="200"
                   style="display:block; margin:0 auto;">
            </td>
          </tr>

          <!-- Título -->
          <tr>
            <td style="color:#FFFFFF; font-size:28px; font-weight:bold; padding-bottom:10px;">
              🎉 Bem-vindo ao UniHungry!
            </td>
          </tr>

          <!-- Saudação -->
          <tr>
            <td style="color:#BBBBBB; font-size:16px; padding-bottom:20px;">
              Olá${name ? ` <span style="color:#1E90FF;">${name}</span>` : ''}!
            </td>
          </tr>

          <!-- Texto -->
          <tr>
            <td style="color:#BBBBBB; font-size:15px; padding-bottom:20px; line-height:1.6;">
              Sua conta foi criada com sucesso no <span style="color:#1E90FF; font-weight:bold;">UniHungry</span>.<br/>
              Você foi cadastrado como <span style="color:#1E90FF; font-weight:bold;">${roleName}</span>.
            </td>
          </tr>

          <!-- Caixa de informações -->
          <tr>
            <td style="padding-bottom:30px;">
              <div style="background-color:#000000; border:1px solid #1E90FF; border-radius:10px; padding:25px; text-align:left;">
                <div style="color:#FFFFFF; font-size:14px; margin-bottom:15px;">
                  <strong style="color:#1E90FF;">📧 E-mail:</strong><br/>
                  <span style="color:#BBBBBB;">${email || '(não informado)'}</span>
                </div>
                <div style="color:#FFFFFF; font-size:14px;">
                  <strong style="color:#1E90FF;">🔐 Acesso:</strong><br/>
                  <span style="color:#BBBBBB;">Use o login via código OTP enviado por e-mail</span>
                </div>
              </div>
            </td>
          </tr>

          <!-- Instruções -->
          <tr>
            <td style="color:#BBBBBB; font-size:14px; padding-bottom:20px; line-height:1.6;">
              <strong style="color:#FFFFFF;">Como fazer login:</strong><br/>
              1. Acesse o sistema UniHungry<br/>
              2. Digite seu e-mail<br/>
              3. Você receberá um código por e-mail<br/>
              4. Insira o código para acessar sua conta
            </td>
          </tr>

          <!-- Botão CTA -->
          <tr>
            <td style="padding-bottom:30px;">
              <a href="http://localhost:3000/auth/login"
                 style="display:inline-block; background-color:#1E90FF; color:#FFFFFF;
                        text-decoration:none; font-size:16px; font-weight:bold;
                        padding:14px 40px; border-radius:8px;">
                Acessar o Sistema
              </a>
            </td>
          </tr>

          <!-- Aviso -->
          <tr>
            <td style="color:#777777; font-size:13px; padding-bottom:20px; padding-top:20px; border-top:1px solid #333333;">
              💡 Sua senha é gerenciada automaticamente pelo sistema.<br/>
              Sempre use o login via código OTP para acessar sua conta.
            </td>
          </tr>

          <!-- Rodapé -->
          <tr>
            <td style="color:#555555; font-size:12px; padding-top:20px;">
              Se você não criou esta conta, entre em contato conosco.<br/><br/>
              © ${new Date().getFullYear()} UniHungry. Todos os direitos reservados.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  private getVotingEmailPlainText(name: string): string {
    return `Olá, ${name}!

Obrigado por usar o UniHungry pelo WhatsApp. Significa muito para nós.

Nosso projeto está participando de uma competição universitária na categoria Software & Computação e contamos com a sua ajuda para ganhar.

Desenvolvemos uma plataforma completa de gestão para restaurantes — com inteligência artificial, controle de mesas em tempo real, dashboard operacional e o chatbot que você acabou de usar.

Se quiser nos apoiar, vote no UniHungry pelo link abaixo:
https://unihungry.com.br/votar

Cada voto nos aproxima de transformar esse projeto em algo ainda maior.
Obrigado de coração pelo seu apoio!

Equipe UniHungry`.trim();
  }

  private getVotingEmailTemplate(name: string): string {
    const year = new Date().getFullYear();
    return `<!DOCTYPE html>
<html lang="pt-BR" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <title>UniHungry precisa de você</title>
</head>
<body style="margin:0; padding:0; background-color:#000000; font-family:Arial, Helvetica, sans-serif; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
         style="background-color:#000000; padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0"
               style="background-color:#111111; border-radius:16px; overflow:hidden; max-width:600px; width:100%;">

          <!-- ── HEADER ── -->
          <tr>
            <td style="background-color:#0d0d0d; padding:40px 40px 0; text-align:center;">
              <img src="${LOGO_URL}" alt="UniHungry" width="160" height="auto"
                   style="display:block; margin:0 auto; border:0; outline:none; text-decoration:none;">
            </td>
          </tr>

          <!-- ── HERO ── -->
          <tr>
            <td style="background-color:#0d0d0d; padding:28px 40px 40px; text-align:center;">

              <!-- Badge da categoria -->
              <table role="presentation" align="center" cellspacing="0" cellpadding="0" border="0"
                     style="margin:0 auto 20px;">
                <tr>
                  <td style="background-color:#0a1628; border:1px solid #1E4D8C;
                              border-radius:20px; padding:6px 18px;">
                    <span style="color:#5BA3FF; font-size:12px; font-weight:bold; letter-spacing:1px;">
                      🏆 &nbsp; SOFTWARE &amp; COMPUTAÇÃO
                    </span>
                  </td>
                </tr>
              </table>

              <h1 style="color:#FFFFFF; font-size:30px; font-weight:900; margin:0 0 12px; line-height:1.3;">
                Contamos com<br>
                <span style="color:#1E90FF;">o seu voto!</span>
              </h1>
              <p style="color:#8899AA; font-size:14px; margin:0; line-height:1.6;">
                Estamos em uma competição universitária e cada voto faz a diferença.
              </p>
            </td>
          </tr>

          <!-- ── CORPO ── -->
          <tr>
            <td style="padding:40px 48px 36px; background-color:#111111;">

              <!-- Saudação -->
              <p style="color:#DDDDDD; font-size:16px; margin:0 0 20px; line-height:1.7;">
                Olá, <strong style="color:#FFFFFF;">${name}</strong>! 👋
              </p>

              <p style="color:#AABBCC; font-size:15px; margin:0 0 16px; line-height:1.8;">
                Obrigado por usar o <strong style="color:#FFFFFF;">UniHungry</strong> pelo WhatsApp!
                Ficamos muito felizes em ter você com a gente.
              </p>

              <p style="color:#AABBCC; font-size:15px; margin:0 0 32px; line-height:1.8;">
                Nosso projeto está participando de uma competição universitária na categoria
                <strong style="color:#1E90FF;">Software &amp; Computação</strong>. Desenvolvemos
                uma plataforma completa de gestão para restaurantes — com IA, controle de mesas
                em tempo real e muito mais.
              </p>

              <!-- Divisor -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                     style="margin-bottom:32px;">
                <tr><td style="border-top:1px solid #222222;"></td></tr>
              </table>

              <!-- Card de votação -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                     style="margin-bottom:32px;">
                <tr>
                  <td style="background-color:#0a1628; border:1px solid #1E4D8C;
                              border-radius:12px; padding:28px; text-align:center;">
                    <div style="font-size:32px; margin-bottom:12px;">🗳️</div>
                    <h2 style="color:#FFFFFF; font-size:20px; font-weight:bold;
                                margin:0 0 10px; line-height:1.4;">
                      Não esquece de votar em nós!
                    </h2>
                    <p style="color:#7A9BBF; font-size:14px; margin:0; line-height:1.7;">
                      O seu voto é o que vai nos levar mais longe.<br>
                      Um gesto simples, um impacto enorme para nossa equipe. ❤️
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Por que votar -->
              <p style="color:#FFFFFF; font-size:15px; font-weight:bold; margin:0 0 16px;">
                Por que o UniHungry merece o seu voto?
              </p>

              <!-- Lista de features -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                     style="margin-bottom:36px;">
                <tr>
                  <td style="padding:12px 0; border-bottom:1px solid #1E1E1E;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="width:32px; vertical-align:middle;">
                          <span style="color:#1E90FF; font-size:18px;">🤖</span>
                        </td>
                        <td style="color:#BBCCDD; font-size:14px; line-height:1.6;">
                          Inteligência artificial para consultas em linguagem natural
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0; border-bottom:1px solid #1E1E1E;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="width:32px; vertical-align:middle;">
                          <span style="color:#1E90FF; font-size:18px;">📊</span>
                        </td>
                        <td style="color:#BBCCDD; font-size:14px; line-height:1.6;">
                          Dashboard com dados operacionais em tempo real
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0; border-bottom:1px solid #1E1E1E;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="width:32px; vertical-align:middle;">
                          <span style="color:#1E90FF; font-size:18px;">💬</span>
                        </td>
                        <td style="color:#BBCCDD; font-size:14px; line-height:1.6;">
                          Chatbot WhatsApp para gestão completa de restaurantes
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="width:32px; vertical-align:middle;">
                          <span style="color:#1E90FF; font-size:18px;">🎓</span>
                        </td>
                        <td style="color:#BBCCDD; font-size:14px; line-height:1.6;">
                          Projeto 100% desenvolvido por universitários
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Encerramento -->
              <p style="color:#7A8899; font-size:14px; margin:0; line-height:1.8; text-align:center;">
                Cada voto nos aproxima de transformar esse projeto em algo ainda maior.<br>
                <strong style="color:#AABBCC;">Obrigado de coração pelo seu apoio.</strong> 🙏
              </p>

            </td>
          </tr>

          <!-- ── RODAPÉ ── -->
          <tr>
            <td style="padding:28px 48px; background-color:#0a0a0a;
                        border-top:1px solid #1a1a1a; text-align:center;">
              <img src="${LOGO_URL}" alt="UniHungry" width="70" height="auto"
                   style="display:block; margin:0 auto 14px; opacity:0.4; border:0;">
              <p style="color:#445566; font-size:12px; margin:0 0 6px; line-height:1.6;">
                Você recebeu este e-mail por ter interagido com o UniHungry no WhatsApp.
              </p>
              <p style="color:#334455; font-size:11px; margin:0;">
                &copy; ${year} UniHungry &nbsp;·&nbsp; Software &amp; Computação<br>
                Desenvolvido com 💙 por universitários
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
  }
}
