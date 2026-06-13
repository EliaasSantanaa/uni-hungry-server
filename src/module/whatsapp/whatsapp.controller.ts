import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  Logger,
  UnauthorizedException,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WhatsAppBotService } from './whatsapp-bot.service';
import { Response } from 'express';
import * as crypto from 'crypto';
import {
  WebChatMessageDto,
  WebChatSessionDto,
} from './dto/web-chat.dto';

interface TwilioPayload {
  From: string;
  Body: string;
  To: string;
  MessageSid: string;
  [key: string]: string;
}

@Controller('whatsapp')
export class WhatsAppController {
  private readonly logger = new Logger(WhatsAppController.name);

  constructor(
    private readonly bot: WhatsAppBotService,
    private readonly config: ConfigService,
  ) {}

  @Post('chat/start')
  @HttpCode(200)
  async startWebChat(@Body() body: WebChatSessionDto) {
    const phone = this.toWebSessionId(body.sessionId);
    const reply = await this.bot.handleMessage(phone, '__start__');
    this.logger.log(`WEB START [${phone}]`);
    return { reply };
  }

  @Post('chat')
  @HttpCode(200)
  async handleWebChat(@Body() body: WebChatMessageDto) {
    const phone = this.toWebSessionId(body.sessionId);
    const reply = await this.bot.handleMessage(phone, body.message.trim());
    this.logger.log(`WEB MSG [${phone}]: ${body.message.slice(0, 80)}`);
    return { reply };
  }

  @Post('chat/reset')
  @HttpCode(200)
  resetWebChat(@Body() body: WebChatSessionDto) {
    const phone = this.toWebSessionId(body.sessionId);
    this.bot.resetSession(phone);
    this.logger.log(`WEB RESET [${phone}]`);
    return { ok: true };
  }

  private toWebSessionId(sessionId: string): string {
    return `web:${sessionId}`;
  }

  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Body() payload: TwilioPayload,
    @Headers('x-twilio-signature') signature: string,
    @Res() res: Response,
  ): Promise<void> {
    this.validateSignature(signature, payload);

    const phone = (payload.From ?? '').replace('whatsapp:', '');
    const body = (payload.Body ?? '').trim();

    this.logger.log(`MSG [${phone}]: ${body.slice(0, 80)}`);

    if (!phone || !body) {
      this.logger.warn('Payload inválido recebido');
      res
        .set('Content-Type', 'text/xml')
        .send(this.twiml('Mensagem inválida.'));
      return;
    }

    try {
      const reply = await this.bot.handleMessage(phone, body);
      this.logger.log(`REPLY [${phone}]: ${reply.slice(0, 80)}`);
      res.set('Content-Type', 'text/xml').send(this.twiml(reply));
    } catch (err) {
      this.logger.error(
        `Erro ao processar mensagem: ${err.message}`,
        err.stack,
      );
      res
        .set('Content-Type', 'text/xml')
        .send(this.twiml('Ocorreu um erro interno. Tente novamente. 🙏'));
    }
  }

  private twiml(message: string): string {
    const safe = message
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${safe}</Message></Response>`;
  }

  private validateSignature(
    signature: string,
    payload: Record<string, string>,
  ): void {
    if (this.config.get('NODE_ENV') !== 'production') return;

    const authToken = this.config.getOrThrow<string>('TWILIO_AUTH_TOKEN');
    const webhookUrl = this.config.getOrThrow<string>('TWILIO_WEBHOOK_URL');

    const paramString = Object.keys(payload)
      .sort()
      .reduce((acc, key) => acc + key + (payload[key] ?? ''), webhookUrl);

    const expected = crypto
      .createHmac('sha1', authToken)
      .update(paramString)
      .digest('base64');

    if (expected !== signature) {
      this.logger.warn('Assinatura Twilio inválida');
      throw new UnauthorizedException('Assinatura inválida');
    }
  }
}
