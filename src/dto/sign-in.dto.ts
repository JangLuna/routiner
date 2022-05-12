import { IsAlphanumeric, IsNotEmpty } from 'class-validator';

export class SignInDto {
  @IsNotEmpty()
  @IsAlphanumeric()
  id: string;

  @IsNotEmpty()
  passcode: string;
}
