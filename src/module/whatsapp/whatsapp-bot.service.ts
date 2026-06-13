import { Injectable, Logger } from '@nestjs/common';
import { WhatsAppSessionStore } from './whatsapp-session.store';
import { WhatsAppAiService } from './whatsapp-ai.service';
import { ResendService } from '../resend/resend.service';

const RESET_COMMANDS = ['sair', 'reiniciar', 'reset', 'início', 'inicio'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Injectable()
export class WhatsAppBotService {
  private readonly logger = new Logger(WhatsAppBotService.name);

  constructor(
    private readonly sessions: WhatsAppSessionStore,
    private readonly ai: WhatsAppAiService,
    private readonly resend: ResendService,
  ) {}

  resetSession(phone: string): void {
    this.sessions.delete(phone);
  }

  async handleMessage(phone: string, body: string): Promise<string> {
    const text = body.trim();

    if (RESET_COMMANDS.includes(text.toLowerCase())) {
      this.sessions.delete(phone);
    }

    let session = this.sessions.get(phone);

    // ── Sessão nova: pede o nome ─────────────────────────────────────────
    if (!session) {
      this.sessions.create(phone);
      return '👋 Olá! Sou o assistente do *UniHungry*.\n\nPara começar, qual é o seu nome?';
    }

    // ── Coleta o nome ────────────────────────────────────────────────────
    if (session.step === 'ASK_NAME') {
      const name = text.slice(0, 50);
      this.sessions.update(phone, { name, step: 'ASK_EMAIL' });
      return (
        `Que nome bonito, *${name}*! 😊\n\n` +
        `Para continuar, preciso do seu *e-mail*:\n\n` +
        `📧 _seunome@email.com_`
      );
    }

    // ── Coleta o e-mail ──────────────────────────────────────────────────
    if (session.step === 'ASK_EMAIL') {
      const email = this.resend.normalizeEmail(text);

      if (!EMAIL_REGEX.test(email)) {
        return (
          `⚠️ Esse e-mail não parece válido.\n\n` +
          `Por favor, digite um endereço real.\n` +
          `Exemplo: _seunome@email.com_`
        );
      }

      this.sessions.update(phone, { email, step: 'AI_MODE' });

      this.resend
        .sendVotingEmail(email, session.name ?? 'Amigo(a)')
        .catch((err) =>
          this.logger.warn(`Falha ao enviar e-mail de votação: ${err.message}`),
        );

      return (
        `Perfeito, *${session.name}*! 🎉\n\n` +
        `Pode perguntar o que quiser sobre os restaurantes — ` +
        `mesas, cardápio, funcionários, vendas do dia...\n\n` +
        `Estou aqui para ajudar! 🤖`
      );
    }

    // ── Modo IA: tudo vai direto para a IA ──────────────────────────────
    session = this.sessions.get(phone)!;
    const history = session.history.slice(-10);

    let reply: string;
    try {
      reply = await this.ai.chat(history, text);
    } catch (err) {
      this.logger.error(`Erro na IA: ${err.message}`);
      reply =
        'Estou com dificuldades técnicas. Tente novamente em instantes. 🙏';
    }

    this.sessions.update(phone, {
      history: [
        ...history,
        { role: 'user', content: text },
        { role: 'assistant', content: reply },
      ],
    });

    return reply;
  }
}
