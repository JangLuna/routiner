import { IsAlphanumeric, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsAlphanumeric()
  id: string;

  @IsNotEmpty()
  passcode: string;

  @IsNotEmpty()
  name: string;
}
