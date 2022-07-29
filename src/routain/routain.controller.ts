import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Render,
  UseGuards,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { userInfo } from 'os';
import { GetUser } from 'src/decorators/get-user.decorator';
import { CreateRoutainDto } from 'src/dto/create-routain.dto';
import { UpdateRoutainDto } from 'src/dto/update-routain.dto';
import { User } from 'src/entities/user.entity';
import { RoutainService } from './routain.service';

@Controller('routain')
export class RoutainController {
  constructor(private routainService: RoutainService) {}

  @Get('/')
  @Render('routain')
  async routain() {}

  @Get('/routain_detail')
  @Render('routain_detail')
  async routainDetail() {}

  @Get('/get_use_routain')
  @UseGuards(AuthGuard())
  getUseRouatin(@GetUser() user: User) {
    return this.routainService.getIsUseRoutain(user);
  }

  @Patch('/set_use_routain')
  @UseGuards(AuthGuard())
  setIsUseRoutain(@GetUser() user: User, @Body('id') routainId: number) {
    return this.routainService.setIsUseRoutain(user, routainId);
  }

  @Post('/get_routain')
  @UseGuards(AuthGuard())
  getRoutain(@GetUser() user: User, @Body('id') routainId: number) {
    return this.routainService.getRoutain(user, routainId);
  }

  @Get('/get_routain_list')
  @UseGuards(AuthGuard())
  getRoutainList(@GetUser() user: User) {
    return this.routainService.getRoutainList(user);
  }

  @Post('/create_routain')
  @UseGuards(AuthGuard())
  @UsePipes(ValidationPipe)
  createRoutain(
    @GetUser() user: User,
    @Body() createRoutainDto: CreateRoutainDto
  ) {
    return this.routainService.createRoutain(user, createRoutainDto);
  }

  @Delete('/delete_routain')
  @UseGuards(AuthGuard())
  deleteRoutain(@GetUser() user: User, @Body('id') routainId: number) {
    return this.routainService.deleteRoutain(user, routainId);
  }

  @Patch('/update_routain')
  @UseGuards(AuthGuard())
  @UsePipes(ValidationPipe)
  updateRoutain(
    @GetUser() user: User,
    @Body() updateRoutainDto: UpdateRoutainDto
  ) {
    return this.routainService.editRoutain(user, updateRoutainDto);
  }

  @Get('/start_routain')
  @UseGuards(AuthGuard())
  startRoutain(@GetUser() user: User, @Body('id') routainId: number) {
    return this.routainService.startRoutain(user, routainId);
  }

  @Get('/stop_routain')
  @UseGuards(AuthGuard())
  stopRoutain(@GetUser() user: User, @Body('id') routainId: number) {
    return this.routainService.stopRoutain(user, routainId);
  }

  @Get('/skip_routain')
  @UseGuards(AuthGuard())
  skipROutain(@GetUser() user: User, @Body('id') routainId: number) {
    return this.routainService.skipRoutain(user, routainId);
  }
}
