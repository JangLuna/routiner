import { Module } from '@nestjs/common';
import { AtomController } from './atom.controller';
import { AtomService } from './atom.service';

@Module({
  controllers: [AtomController],
  providers: [AtomService]
})
export class AtomModule {}
