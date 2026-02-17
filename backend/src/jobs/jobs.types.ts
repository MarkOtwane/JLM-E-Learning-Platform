export type JobType = 'send-email';

export interface SendEmailJobData {
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
}

export interface JobPayload {
  type: JobType;
  data: SendEmailJobData;
}
