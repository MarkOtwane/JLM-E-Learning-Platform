/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs';
import * as hbs from 'handlebars';
import { createTransport, Transporter } from 'nodemailer';
import * as path from 'path';

@Injectable()
export class MailerService {
  private transporter: Transporter;

  constructor() {
    this.transporter = createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    }) as any;
  }

  async sendMail({
    to,
    subject,
    template,
    context,
  }: {
    to: string;
    subject: string;
    template: string;
    context: Record<string, any>;
  }): Promise<void> {
    try {
      const templatePath = path.join(
        __dirname,
        '..',
        'notifications',
        'templates',
        `${template}.hbs`,
      );
      const html = await this.renderTemplate(templatePath, context);

      await this.transporter.sendMail({
        from: `JLM E-Learning <${process.env.MAIL_USER}>`,
        to,
        subject,
        html,
      });
    } catch (error) {
      console.error('MailerService error:', error);
      throw new InternalServerErrorException('Email failed to send');
    }
  }

  private async renderTemplate(
    filePath: string,
    context: Record<string, any>,
  ): Promise<string> {
    const templateSource = await fs.promises.readFile(filePath, 'utf8');
    const compiled = hbs.compile(templateSource);
    return compiled(context);
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    await this.sendMail({
      to: email,
      subject: 'Password Reset Request',
      template: 'welcome-user', // You may want to create a specific password reset template
      context: {
        name: 'User',
        resetLink,
      },
    });
  }
}
