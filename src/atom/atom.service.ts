import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Atom } from 'src/entities/atom.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AtomService {
  constructor(
    @InjectRepository(Atom)
    private atomRepository: Repository<Atom>,
  ) {}

  async createAtom() {}

  async deleteAtom() {}

  async editAtom() {}
}
