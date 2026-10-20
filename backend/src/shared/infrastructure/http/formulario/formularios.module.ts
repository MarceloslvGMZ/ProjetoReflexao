import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { FormulariosController } from './formularios.controller.js';
import { FormulariosService } from './formularios.service.js';

@Module({
  imports: [DiscoveryModule],
  controllers: [FormulariosController],
  providers: [FormulariosService],
})
export class FormulariosModule {}
