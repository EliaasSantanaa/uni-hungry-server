import { Module } from '@nestjs/common';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppBotService } from './whatsapp-bot.service';
import { WhatsAppAiService } from './whatsapp-ai.service';
import { WhatsAppQueryService } from './whatsapp-query.service';
import { WhatsAppSessionStore } from './whatsapp-session.store';
import { PrismaModule } from 'src/database/prisma.module';
import { ResendModule } from '../resend/resend.module';

@Module({
  imports: [PrismaModule, ResendModule],
  controllers: [WhatsAppController],
  providers: [
    WhatsAppBotService,
    WhatsAppAiService,
    WhatsAppQueryService,
    WhatsAppSessionStore,
  ],
})
export class WhatsAppModule {}
