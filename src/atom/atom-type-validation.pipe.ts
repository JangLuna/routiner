import {
  ArgumentMetadata,
  BadRequestException,
  PipeTransform,
} from '@nestjs/common';
import { AtomType } from './atom-type.enum';

export class AtomTypeValidationPipe implements PipeTransform {
  readonly types = [AtomType.MUST, AtomType.WANT];

  transform(value: any) {
    value = value.toUpperCase();

    if (this.types.indexOf(value) === -1) {
      throw new BadRequestException(`Atom Type is not appropriate type`);
    }

    return value;
  }
}
