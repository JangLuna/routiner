import { Controller, Get, Render } from '@nestjs/common';

@Controller('routain-detail')
export class RoutainDetailController {
  @Get('/')
  @Render('routain_detail')
  routainDetail() {}
}
