import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Post,
  Render,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/decorators/get-user.decorator';
import { CreateAtomDto } from 'src/dto/create-atom.dto';
import { User } from 'src/entities/user.entity';
import { AtomTypeValidationPipe } from './atom-type-validation.pipe';
import { AtomType } from './atom-type.enum';
import { AtomService } from './atom.service';

@Controller('atom')
export class AtomController {
  constructor(private atomService: AtomService) {}

  @Get('/')
  @Render('atoms')
  async atom() {}

  @Post('/create_atom')
  @UseGuards(AuthGuard())
  createAtom(
    @GetUser() user: User,
    @Body('text') text: string,
    @Body('type', AtomTypeValidationPipe) type: AtomType,
  ) {
    console.log(user);

    text = text.trim();
    if (text.length == 0) {
      throw new BadRequestException('text is empty.');
    }

    let createAtomDto = new CreateAtomDto();
    createAtomDto.text = text;
    createAtomDto.type = type;
    return this.atomService.createAtom(user, createAtomDto);
  }

  @Delete('/delete_atom')
  @UseGuards(AuthGuard())
  deleteAtom(@GetUser() user: User, @Body('id') atomId: number) {
    return this.atomService.deleteAtom(user, atomId);
  }
}
