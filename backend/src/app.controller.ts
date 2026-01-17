import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/decorators';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Get('/')
  getRoot(): string {
    return this.appService.getRoot();
  }

  @Public()
  @Get('health')
  getHealth(): string {
    return 'OK';
  }
}
