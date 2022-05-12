import {
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CreateUserDto } from 'src/dto/create-user.dto';
import { ResponseDto } from 'src/dto/response.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
  @UsePipes(ValidationPipe)
  async signUp(@Body() createUserDto: CreateUserDto): Promise<ResponseDto> {
    console.log(createUserDto);
    return this.authService.createUser(createUserDto);
  }
}
