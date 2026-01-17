import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getRoot(): string {
    return 'Welcome to JLM E-Learning Platform API';
  }
}
