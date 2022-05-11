import { Module } from '@nestjs/common';
import { RoutainController } from './routain.controller';
import { RoutainService } from './routain.service';

@Module({
  controllers: [RoutainController],
  providers: [RoutainService]
})
export class RoutainModule {}
