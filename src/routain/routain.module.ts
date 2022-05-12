import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { Atom } from 'src/entities/atom.entity';
import { RoutainLog } from 'src/entities/routain-log.entity';
import { Routain } from 'src/entities/routain.entity';
import { RoutainAtomPair } from 'src/entities/routain_atom_pair.entity';
import { RoutainController } from './routain.controller';
import { RoutainService } from './routain.service';

@Module({
  controllers: [RoutainController],
  providers: [RoutainService],
  imports: [
    TypeOrmModule.forFeature([Routain, RoutainLog, Atom, RoutainAtomPair]),
    AuthModule,
  ],
})
export class RoutainModule {}
