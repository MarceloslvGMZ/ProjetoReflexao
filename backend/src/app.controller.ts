import { Controller, Get } from '@nestjs/common';
import { Publico } from './modules/auth/infrastructure/http/decorators.js';

@Controller()
export class AppController {
  @Publico()
  @Get('health')
  health() {
    return { status: 'ok' };
  }
}
