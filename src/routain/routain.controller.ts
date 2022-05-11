import { Controller, Get, Render } from '@nestjs/common';
import { RoutainService } from './routain.service';

@Controller('routain')
export class RoutainController {
  constructor(private routainService: RoutainService) {}

  @Get('/')
  @Render('routain')
  async routain() {}
}
