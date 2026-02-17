import { Injectable, Logger } from '@nestjs/common';
import { Client } from '@upstash/qstash';
import { MailerService } from '../mailer/mailer.service';
import { JobPayload, SendEmailJobData } from './jobs.types';

@Injectable()
export class JobsService {
  private readonly logger = new Logger('JobsService');
  private readonly client?: Client;
  private readonly enabled: boolean;

  constructor(private readonly mailerService: MailerService) {
    this.enabled = process.env.JOB_QUEUE_ENABLED === 'true';

    if (this.enabled && process.env.QSTASH_TOKEN) {
      this.client = new Client({ token: process.env.QSTASH_TOKEN });
    }
  }

  private get targetUrl(): string {
    const baseUrl = process.env.API_BASE_URL;
    if (!baseUrl) {
      throw new Error('API_BASE_URL is required when job queue is enabled');
    }
    return `${baseUrl}/api/jobs/process`;
  }

  async enqueueEmail(data: SendEmailJobData): Promise<void> {
    return this.enqueue({ type: 'send-email', data });
  }

  async enqueue(payload: JobPayload): Promise<void> {
    if (!this.enabled || !this.client) {
      await this.process(payload);
      return;
    }

    await this.client.publishJSON({
      url: this.targetUrl,
      body: payload,
    });
  }

  async process(payload: JobPayload): Promise<void> {
    switch (payload.type) {
      case 'send-email':
        await this.mailerService.sendMail(payload.data);
        break;
      default:
        this.logger.warn(`Unhandled job type: ${payload.type}`);
    }
  }
}
