import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WhatsAppQueryService } from './whatsapp-query.service';
import { TableStatus } from 'generated/prisma/client';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Funções que a IA pode chamar — definidas no formato OpenAI/Groq tool calling
const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'list_restaurants',
      description:
        'Lista todos os restaurantes ativos do sistema com contagem de funcionários, mesas e itens do cardápio.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_tables',
      description:
        'Busca as mesas de um restaurante com status em tempo real (disponível, ocupada, reservada). Mostra comanda aberta se houver.',
      parameters: {
        type: 'object',
        properties: {
          restaurant_name: {
            type: 'string',
            description: 'Nome (ou parte do nome) do restaurante',
          },
          status: {
            type: 'string',
            enum: ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'INACTIVE'],
            description: 'Filtrar por status. Omita para trazer todas.',
          },
        },
        required: ['restaurant_name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_employees',
      description:
        'Lista funcionários de um restaurante com nome, cargo, status ativo/inativo.',
      parameters: {
        type: 'object',
        properties: {
          restaurant_name: {
            type: 'string',
            description: 'Nome (ou parte do nome) do restaurante',
          },
          only_active: {
            type: 'boolean',
            description: 'Se true, retorna apenas funcionários ativos.',
          },
        },
        required: ['restaurant_name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_sales_today',
      description:
        'Retorna as vendas do dia de um restaurante: receita total, comandas abertas/fechadas, itens mais vendidos.',
      parameters: {
        type: 'object',
        properties: {
          restaurant_name: {
            type: 'string',
            description: 'Nome (ou parte do nome) do restaurante',
          },
        },
        required: ['restaurant_name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_menu',
      description:
        'Retorna o cardápio de um restaurante agrupado por categoria.',
      parameters: {
        type: 'object',
        properties: {
          restaurant_name: {
            type: 'string',
            description: 'Nome (ou parte do nome) do restaurante',
          },
          only_available: {
            type: 'boolean',
            description: 'Se true, retorna apenas itens disponíveis.',
          },
        },
        required: ['restaurant_name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_restaurant_summary',
      description:
        'Retorna um resumo completo de um restaurante: dados gerais, funcionários, mesas e vendas do dia.',
      parameters: {
        type: 'object',
        properties: {
          restaurant_name: {
            type: 'string',
            description: 'Nome (ou parte do nome) do restaurante',
          },
        },
        required: ['restaurant_name'],
      },
    },
  },
];

const SYSTEM_PROMPT = `
Você é o assistente virtual do sistema Uni Hungry, um chatbot de WhatsApp para gestão de restaurantes.
Você conversa com administradores que querem consultar dados operacionais em tempo real.

Instruções:
- Sempre use as ferramentas disponíveis para buscar dados reais antes de responder
- NUNCA invente ou assuma dados — sempre consulte o banco via ferramentas
- Responda em português brasileiro, de forma natural, concisa e amigável
- Use emojis com moderação
- Formate valores como R$ 1.234,56
- Respostas curtas são melhores para WhatsApp (máx 10 linhas)
- Se o usuário não especificar o restaurante e houver mais de um, pergunte qual
`.trim();

@Injectable()
export class WhatsAppAiService {
  private readonly logger = new Logger(WhatsAppAiService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly query: WhatsAppQueryService,
  ) {}

  async chat(history: ChatMessage[], userMessage: string): Promise<string> {
    try {
      this.logger.debug('Tentando Groq...');
      return await this.callWithTools('groq', history, userMessage);
    } catch (err) {
      this.logger.warn(
        `Groq falhou (${err.message}), ativando Ollama Cloud...`,
      );
    }

    try {
      return await this.callWithTools('ollama', history, userMessage);
    } catch (err) {
      this.logger.error(`Ollama também falhou: ${err.message}`);
      return 'Estou com dificuldades técnicas. Tente em instantes. 🙏';
    }
  }

  // ── Motor de function calling ──────────────────────────────────────────
  private async callWithTools(
    provider: 'groq' | 'ollama',
    history: ChatMessage[],
    userMessage: string,
  ): Promise<string> {
    const messages: any[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMessage },
    ];

    // Primeira chamada — IA decide se precisa de alguma ferramenta
    let response = await this.callApi(provider, messages, true);

    // Loop de tool calling (a IA pode chamar múltiplas ferramentas)
    let iterations = 0;
    while (response.tool_calls?.length && iterations < 5) {
      iterations++;

      // Adiciona a resposta da IA com as tool calls ao histórico
      messages.push({ role: 'assistant', ...response });

      // Executa cada tool call e adiciona o resultado
      for (const toolCall of response.tool_calls) {
        const result = await this.executeTool(
          toolCall.function.name,
          JSON.parse(toolCall.function.arguments),
        );

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }

      // Nova chamada com os resultados das ferramentas
      response = await this.callApi(provider, messages, false);
    }

    return response.content?.trim() ?? 'Não consegui processar sua pergunta.';
  }

  // ── Executa a função solicitada pela IA ────────────────────────────────
  private async executeTool(
    name: string,
    args: Record<string, any>,
  ): Promise<unknown> {
    this.logger.debug(
      `Executando tool: ${name} com args: ${JSON.stringify(args)}`,
    );

    try {
      // Resolve nome do restaurante para ID quando necessário
      const resolveRestaurant = async (restaurantName: string) => {
        const r = await this.query.findRestaurantByName(restaurantName);
        if (!r)
          throw new Error(`Restaurante "${restaurantName}" não encontrado.`);
        return r;
      };

      switch (name) {
        case 'list_restaurants':
          return await this.query.listRestaurants();

        case 'get_tables': {
          const r = await resolveRestaurant(args.restaurant_name);
          return await this.query.getTables(
            r.id,
            args.status as TableStatus | undefined,
          );
        }

        case 'get_employees': {
          const r = await resolveRestaurant(args.restaurant_name);
          return await this.query.getEmployees(r.id, args.only_active);
        }

        case 'get_sales_today': {
          const r = await resolveRestaurant(args.restaurant_name);
          return await this.query.getSalesToday(r.id);
        }

        case 'get_menu': {
          const r = await resolveRestaurant(args.restaurant_name);
          return await this.query.getMenu(r.id, args.only_available);
        }

        case 'get_restaurant_summary': {
          const r = await resolveRestaurant(args.restaurant_name);
          return await this.query.getRestaurantSummary(r.id);
        }

        default:
          return { error: `Função desconhecida: ${name}` };
      }
    } catch (err) {
      return { error: err.message };
    }
  }

  // ── Chamada HTTP para Groq ou Ollama ───────────────────────────────────
  private async callApi(
    provider: 'groq' | 'ollama',
    messages: any[],
    withTools: boolean,
  ): Promise<any> {
    if (provider === 'groq') {
      return this.callGroq(messages, withTools);
    }
    return this.callOllama(messages, withTools);
  }

  private async callGroq(messages: any[], withTools: boolean): Promise<any> {
    const apiKey = this.config.getOrThrow<string>('GROQ_API_KEY');

    const body: any = {
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.3,
      max_tokens: 1024,
    };

    if (withTools) {
      body.tools = TOOLS;
      body.tool_choice = 'auto';
    }

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok)
      throw new Error(`Groq HTTP ${res.status}: ${await res.text()}`);

    const data = await res.json();
    return data.choices?.[0]?.message;
  }

  private async callOllama(messages: any[], withTools: boolean): Promise<any> {
    const apiKey = this.config.getOrThrow<string>('OLLAMA_API_KEY');

    const body: any = {
      model: 'gemma4:12b',
      messages,
      stream: false,
      options: { temperature: 0.3, num_predict: 1024 },
    };

    if (withTools) body.tools = TOOLS;

    const res = await fetch('https://ollama.com/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok)
      throw new Error(`Ollama HTTP ${res.status}: ${await res.text()}`);

    const data = await res.json();
    // Ollama retorna no formato ligeiramente diferente do OpenAI
    return {
      content: data.message?.content,
      tool_calls: data.message?.tool_calls,
    };
  }
}
