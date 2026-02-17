import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";

@Injectable()
export class ResendService {
    private readonly logger = new Logger(ResendService.name);
    private readonly resend: Resend;
    fromEmail: string;

    constructor(private readonly configService: ConfigService) {
        const apiKey = this.configService.get<string>("RESEND_API_KEY");
        const email = this.configService.get<string>("RESEND_FROM");
        if (!apiKey || !email) {
            throw new Error("Variaveis Resend não configuradas");
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
}