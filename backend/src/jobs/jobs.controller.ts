import {
    Controller,
    Post,
    Req,
    UnauthorizedException,
} from '@nestjs/common';
import { Receiver } from '@upstash/qstash';
import { Request } from 'express';
import { Public } from '../auth/decorators';
import { JobsService } from './jobs.service';
import { JobPayload } from './jobs.types';

@Controller('jobs')
export class JobsController {
  private readonly receiver?: Receiver;

  constructor(private readonly jobsService: JobsService) {
    if (
      process.env.JOB_QUEUE_ENABLED === 'true' &&
      process.env.QSTASH_CURRENT_SIGNING_KEY &&
      process.env.QSTASH_NEXT_SIGNING_KEY
    ) {
      this.receiver = new Receiver({
        currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
        nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY,
      });
    }
  }

  @Public()
  @Post('process')
  async processJob(@Req() request: Request & { rawBody?: Buffer }) {
    if (process.env.JOB_QUEUE_ENABLED !== 'true') {
      return { received: true };
    }

    if (!this.receiver) {
      throw new UnauthorizedException('QStash signing keys not configured');
    }

    const signature = request.headers['upstash-signature'] as string;
    const body = request.rawBody?.toString() ?? JSON.stringify(request.body);

    const isValid = await this.receiver.verify({
      signature,
      body,
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid signature');
    }

    await this.jobsService.process(request.body as JobPayload);
    return { received: true };
  }
}
