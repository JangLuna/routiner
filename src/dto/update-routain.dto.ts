import { IsBoolean, IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateRoutainDto {
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  atomIdList: string;

  @IsNotEmpty()
  @IsBoolean()
  isUse: boolean;
}
