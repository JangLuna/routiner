import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoutainLog } from 'src/entities/routain-log.entity';
import { Routain } from 'src/entities/routain.entity';
import { RoutainController } from './routain.controller';
import { RoutainService } from './routain.service';

@Module({
  controllers: [RoutainController],
  providers: [RoutainService],
  imports: [TypeOrmModule.forFeature([Routain, RoutainLog])],
})
export class RoutainModule {}
