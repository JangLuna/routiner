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
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
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

  @Get('/get_use_routain')
  @UseGuards(AuthGuard())
  getInUseRouatin(@GetUser() user: User) {
    return this.routainService.getIsUseRoutain(user);
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
    @Body() createRoutainDto: CreateRoutainDto,
  ) {
    return this.routainService.createRoutain(user, createRoutainDto);
  }

  @Delete('/delete_routain')
  @UseGuards(AuthGuard())
  deleteRoutain(@GetUser() user: User, @Body('id') routainId: number) {
    return this.routainService.deleteRoutain(user, routainId);
  }

  @Get('/start_routain')
  @UseGuards(AuthGuard())
  startRoutain(@GetUser() user: User) {}

  @Get('/stop_routain')
  @UseGuards(AuthGuard())
  stopRoutain(@GetUser() user: User) {}

  @Patch('/update_routain')
  @UseGuards(AuthGuard())
  @UsePipes(ValidationPipe)
  updateRoutain(
    @GetUser() user: User,
    @Body() updateRoutainDto: UpdateRoutainDto,
  ) {
    return this.routainService.editRoutain(user, updateRoutainDto);
  }
}
