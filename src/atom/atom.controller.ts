import { Controller, Get, Render } from '@nestjs/common';
import { AtomService } from './atom.service';

@Controller('atom')
export class AtomController {
  constructor(private atomService: AtomService) {}

  @Get('/')
  @Render('atoms')
  async atom() {}
}
