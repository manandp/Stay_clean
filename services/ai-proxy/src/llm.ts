import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { RiskLevelSchema, type RiskLevel } from '@stay-clean/shared';
import { z } from 'zod';
import { CLASSIFIER_PROMPT, wrapShared } from './prompts';

export interface Llm {
  /** Returns the model's risk assessment. Throws on failure; callers fail safe. */
  classifyRisk(text: string): Promise<RiskLevel>;
  /** Returns reply text, or null when the model declined. */
  generate(system: string, userText: string, maxTokens: number): Promise<string | null>;
}

export interface LlmConfig {
  apiKey: string;
  model: string;
  classifierModel: string;
  timeoutMs: number;
}

const ClassificationSchema = z.object({
  risk: RiskLevelSchema,
  categories: z.array(z.string()),
});

export function createAnthropicLlm(config: LlmConfig): Llm {
  const client = new Anthropic({ apiKey: config.apiKey, timeout: config.timeoutMs, maxRetries: 1 });

  return {
    async classifyRisk(text) {
      const response = await client.messages.parse({
        model: config.classifierModel,
        max_tokens: 2000,
        system: CLASSIFIER_PROMPT,
        messages: [{ role: 'user', content: wrapShared(text) }],
        output_config: { effort: 'low', format: zodOutputFormat(ClassificationSchema) },
      });
      if (response.stop_reason === 'refusal' || !response.parsed_output) {
        throw new Error(`classifier returned no result (${response.stop_reason})`);
      }
      return response.parsed_output.risk;
    },

    async generate(system, userText, maxTokens) {
      const response = await client.beta.messages.create({
        model: config.model,
        max_tokens: maxTokens,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: 'low' },
        system,
        messages: [{ role: 'user', content: wrapShared(userText) }],
      });
      if (response.stop_reason === 'refusal') return null;
      const text = response.content
        .map((block) => (block.type === 'text' ? block.text : ''))
        .join('')
        .trim();
      return text.length > 0 ? text : null;
    },
  };
}
