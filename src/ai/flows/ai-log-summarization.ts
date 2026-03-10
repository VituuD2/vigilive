'use server';
/**
 * @fileOverview A Genkit flow for summarizing system and recording event logs using AI.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SystemLogEntrySchema = z.object({
  id: z.string().describe('Unique identifier for the system log entry.'),
  level: z.string().describe('Severity level of the log (e.g., info, warn, error, debug).'),
  message: z.string().describe('The main message of the system log entry.'),
  context: z.record(z.any()).optional().describe('JSON object providing additional context for the log.'),
  created_at: z.string().describe('Timestamp when the log was created (ISO format).'),
});

const RecordingEventEntrySchema = z.object({
  id: z.string().describe('Unique identifier for the recording event entry.'),
  event_type: z.string().describe('Type of recording event (e.g., START, STOP, ERROR, LIVE_DETECTED).'),
  message: z.string().describe('The main message describing the recording event.'),
  context: z.record(z.any()).optional().describe('JSON object providing additional context for the event.'),
  created_at: z.string().describe('Timestamp when the event occurred (ISO format).'),
});

const LogSummarizationInputSchema = z.object({
  systemLogs: z.array(SystemLogEntrySchema).describe('An array of system log entries relevant to the summarization request.'),
  recordingEvents: z.array(RecordingEventEntrySchema).describe('An array of recording event entries relevant to the summarization request.'),
  contextIdentifier: z.string().optional().describe('An optional identifier (e.g., target ID or recording ID) to contextualize the summary.'),
});
export type LogSummarizationInput = z.infer<typeof LogSummarizationInputSchema>;

const LogSummarizationOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the operational status, key events, and identified issues.'),
  keyEvents: z.array(z.string()).describe('A list of significant events extracted from the logs.'),
  potentialIssues: z.array(z.string()).describe('A list of potential problems or anomalies identified during the log analysis.'),
});
export type LogSummarizationOutput = z.infer<typeof LogSummarizationOutputSchema>;

const prompt = ai.definePrompt({
  name: 'logSummarizationPrompt',
  input: { schema: LogSummarizationInputSchema },
  output: { schema: LogSummarizationOutputSchema },
  prompt: `You are an expert operations analyst. Your task is to analyze the provided system logs and recording events to generate a concise summary of the operational status, highlight key events, and identify any potential issues or anomalies.

  {{#if contextIdentifier}}
  The logs are primarily related to identifier: {{{contextIdentifier}}}.
  {{/if}}

  System Logs:
  {{#if systemLogs.length}}
  {{#each systemLogs}}
  - [{{created_at}}] [{{level}}] {{{message}}}{{#if context}} (Context: {{json context}}){{/if}}
  {{/each}}
  {{else}}
  No system logs provided.
  {{/if}}

  Recording Events:
  {{#if recordingEvents.length}}
  {{#each recordingEvents}}
  - [{{created_at}}] [{{event_type}}] {{{message}}}{{#if context}} (Context: {{json context}}){{/if}}
  {{/each}}
  {{else}}
  No recording events provided.
  {{/if}}

  Based on the above logs, provide a comprehensive summary, list key events, and identify any potential issues. The output should strictly adhere to the following JSON schema:
  {{jsonSchema output}}
  `,
});

const logSummarizationFlow = ai.defineFlow(
  {
    name: 'logSummarizationFlow',
    inputSchema: LogSummarizationInputSchema,
    outputSchema: LogSummarizationOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate log summary.');
    }
    return output;
  }
);

export async function summarizeLogs(input: LogSummarizationInput): Promise<LogSummarizationOutput> {
  return logSummarizationFlow(input);
}
