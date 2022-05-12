import { IsBoolean, IsNotEmpty } from 'class-validator';

export class CreateRoutainDto {
  @IsNotEmpty()
  name: string;

  atomIdList: string;

  @IsBoolean()
  isUse: boolean;
}
