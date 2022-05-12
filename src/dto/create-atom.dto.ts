import { IsNotEmpty } from 'class-validator';
import { AtomType } from 'src/atom/atom-type.enum';

export class CreateAtomDto {
  @IsNotEmpty()
  text: string;

  @IsNotEmpty()
  type: AtomType;
}
