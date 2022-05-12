import {
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Render,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/decorators/get-user.decorator';
import { User } from 'src/entities/user.entity';
import { RoutainService } from './routain.service';

@Controller('routain')
export class RoutainController {
  constructor(private routainService: RoutainService) {}

  @Get('/')
  @Render('routain')
  async routain() {}

  @Get('/get_routain_list')
  getRoutainList() {}

  @Post('/create_routain')
  createRoutain() {}

  @Delete('/delete_routain')
  deleteRoutain() {}

  @Get('/start_routain')
  startRoutain() {}

  @Get('/stop_routain')
  stopRoutain() {}

  @Patch('/update_routain')
  @UseGuards(AuthGuard())
  updateRoutain(@GetUser() user: User) {
    return this.routainService.getRoutainList(user);
  }
}
