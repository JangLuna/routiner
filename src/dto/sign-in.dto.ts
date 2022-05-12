import { IsAlphanumeric, IsNotEmpty } from 'class-validator';

export class SignInDto {
  @IsNotEmpty()
  id: string;

  @IsNotEmpty()
  passcode: string;
}
