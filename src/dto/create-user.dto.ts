import { IsAlphanumeric, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  id: string;

  @IsNotEmpty()
  passcode: string;

  @IsNotEmpty()
  name: string;
}
