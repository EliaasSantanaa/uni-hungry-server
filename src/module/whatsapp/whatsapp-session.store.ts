import { Injectable } from '@nestjs/common';

export type ConversationStep =
  | 'ASK_NAME'
  | 'ASK_EMAIL'
  | 'MENU'
  | 'LIST_RESTAURANTS'
  | 'RESTAURANT_DETAIL'
  | 'AI_MODE';

export interface WhatsAppSession {
  phone: string;
  name?: string;
  email?: string;
  step: ConversationStep;
  selectedRestaurantId?: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  lastActivity: Date;
}

@Injectable()
export class WhatsAppSessionStore {
  private readonly sessions = new Map<string, WhatsAppSession>();
  private readonly TTL_MS = 30 * 60 * 1000;

  get(phone: string): WhatsAppSession | undefined {
    const session = this.sessions.get(phone);
    if (!session) return undefined;
    if (Date.now() - session.lastActivity.getTime() > this.TTL_MS) {
      this.sessions.delete(phone);
      return undefined;
    }
    return session;
  }

  create(phone: string): WhatsAppSession {
    const session: WhatsAppSession = {
      phone,
      step: 'ASK_NAME',
      history: [],
      lastActivity: new Date(),
    };
    this.sessions.set(phone, session);
    return session;
  }

  update(phone: string, patch: Partial<WhatsAppSession>): WhatsAppSession {
    const session = this.get(phone) ?? this.create(phone);
    const updated = { ...session, ...patch, lastActivity: new Date() };
    this.sessions.set(phone, updated);
    return updated;
  }

  delete(phone: string): void {
    this.sessions.delete(phone);
  }
}
