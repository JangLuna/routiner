import { Module } from '@nestjs/common';
import { RoutainDetailController } from './routain-detail.controller';

@Module({
  controllers: [RoutainDetailController]
})
export class RoutainDetailModule {}
