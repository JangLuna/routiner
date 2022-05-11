import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Atom } from 'src/entities/atom.entity';
import { AtomController } from './atom.controller';
import { AtomService } from './atom.service';

@Module({
  controllers: [AtomController],
  providers: [AtomService],
  imports: [TypeOrmModule.forFeature([Atom])],
})
export class AtomModule {}
