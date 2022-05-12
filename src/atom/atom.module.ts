import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { Atom } from 'src/entities/atom.entity';
import { AtomController } from './atom.controller';
import { AtomService } from './atom.service';

@Module({
  controllers: [AtomController],
  providers: [AtomService],
  imports: [TypeOrmModule.forFeature([Atom]), AuthModule],
})
export class AtomModule {}
