import {
  Body,
  Controller,
  Get,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CreateUserDto } from 'src/dto/create-user.dto';
import { ResponseDto } from 'src/dto/response.dto';
import { SignInDto } from 'src/dto/sign-in.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
  @UsePipes(ValidationPipe)
  async signUp(@Body() createUserDto: CreateUserDto): Promise<ResponseDto> {
    return this.authService.createUser(createUserDto);
  }

  @Get('/signin')
  @UsePipes(ValidationPipe)
  async signIn(@Body() signInDto: SignInDto): Promise<ResponseDto> {
    return this.authService.login(signInDto);
  }
}
