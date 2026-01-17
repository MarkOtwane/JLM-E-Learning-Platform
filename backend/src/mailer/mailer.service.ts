/* eslint-disable @typescript-eslint/no-unsafe-member-access */
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
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
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
        '..',
        'notification',
        'template',
        `${template}.hbs`,
      );
      const html = await this.renderTemplate(templatePath, context);

      const mailOptions = {
        from: `JLM E-Learning <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
    } catch (error) {
      console.error('MailerService error details:', {
        message: error.message,
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode,
      });
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

  async testEmailConfiguration(): Promise<boolean> {
    try {
      console.log('Testing email configuration...');
      console.log('SMTP_HOST:', process.env.SMTP_HOST);
      console.log('SMTP_PORT:', process.env.SMTP_PORT);
      console.log('SMTP_USER:', process.env.SMTP_USER);
      console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***' : 'NOT SET');

      // Test the connection
      await this.transporter.verify();
      console.log('Email configuration is valid!');
      return true;
    } catch (error) {
      console.error('Email configuration test failed:', error);
      return false;
    }
  }
}
