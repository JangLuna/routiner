import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateUserDto } from 'src/dto/create-user.dto';
import { ResponseDto } from 'src/dto/response.dto';
import { SignInDto } from 'src/dto/sign-in.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
  @UsePipes(ValidationPipe)
  signUp(@Body() createUserDto: CreateUserDto) {
    return this.authService.createUser(createUserDto);
  }

  @Post('/signin')
  @UsePipes(ValidationPipe)
  signIn(@Body() signInDto: SignInDto) {
    return this.authService.login(signInDto);
  }

  @Post('/send_verification_sms')
  sendVerificationSms(@Body('phone') phone: string) {
    console.log('sms controller called');
    return this.authService.sendVerificationSMS(phone);
  }

  // @Post('/verify_token')
  // verifyToken(@Body('token') token: string) {
  //   return this.authService.verifyToken(token);
  // }
}
