import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateAtomDto } from 'src/dto/create-atom.dto';
import { ResponseDto } from 'src/dto/response.dto';
import { Atom } from 'src/entities/atom.entity';
import { User } from 'src/entities/user.entity';
import { getConnection, Repository } from 'typeorm';
import { AtomType } from './atom-type.enum';

@Injectable()
export class AtomService {
  constructor(
    @InjectRepository(Atom)
    private atomRepository: Repository<Atom>,
  ) {}

  async createAtom(
    user: User,
    createAtomDto: CreateAtomDto,
  ): Promise<ResponseDto> {
    let { text, type } = createAtomDto;

    let count = await this.atomRepository.count({
      where: {
        registeredUser: user,
        text,
      },
    });

    if (count > 0) {
      return new ResponseDto(
        HttpStatus.CONFLICT,
        'ALREADY_EXIST_ATOM',
        true,
        'ALREADY_EXIST_ATOM',
      );
    }

    let atom: Atom = this.atomRepository.create({
      text: text,
      type,
      registeredUser: user,
    });

    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      atom = await queryRunner.manager.save(atom);
      await queryRunner.commitTransaction();

      delete atom.registeredUser;

      return new ResponseDto(
        HttpStatus.ACCEPTED,
        'SUCCESS',
        false,
        'SUCCESS',
        atom,
      );
    } catch (e) {
      await queryRunner.rollbackTransaction();
      return new ResponseDto(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'INTERNAL_SERVER_ERROR',
        true,
        'INTERNAL_SERVER_ERROR',
        e,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async deleteAtom(user: User, atomId: number): Promise<ResponseDto> {
    const atom = await this.atomRepository.findOne({
      relations: ['registeredUser', 'routainList'],
      where: { id: atomId },
    });

    if (!atom) {
      return new ResponseDto(
        HttpStatus.NOT_FOUND,
        'UNREGISTERED_ATOM',
        true,
        'UNREGISTERED_ATOM',
      );
    }

    if (atom.registeredUser.idx != user.idx) {
      return new ResponseDto(
        HttpStatus.UNAUTHORIZED,
        'NOT_ATOM_OWNER',
        true,
        'NOT_ATOM_OWNER',
      );
    }

    if (atom.routainList.length > 0) {
      return new ResponseDto(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'USING_ATOM',
        true,
        'USING_ATOM',
      );
    }

    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await queryRunner.manager.delete(Atom, { id: atom.id });
      await queryRunner.commitTransaction();
      return new ResponseDto(200, 'SUCCESS', false, 'SUCCESS', result);
    } catch (e) {
      await queryRunner.rollbackTransaction();
      return new ResponseDto(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'INTERNAL_SERVER_ERROR',
        true,
        'INTERNAL_SERVER_ERROR',
        e,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async editAtom() {}

  async getAtomList(user: User): Promise<ResponseDto> {
    const atomList = await this.atomRepository.find({
      where: { registeredUser: user },
      order: { createdDate: 'ASC' },
    });

    // let mustAtomList: Atom[] = [];
    // let wantAtomList: Atom[] = [];

    // if (atomList.length > 0) {
    //   for (let i in atomList) {
    //     let atom: Atom = atomList[i];
    //     delete atom.registeredUser;

    //     if (atom.type == AtomType.MUST) {
    //       mustAtomList.push(atom);
    //     } else {
    //       wantAtomList.push(atom);
    //     }
    //   }
    // }

    return new ResponseDto(HttpStatus.ACCEPTED, 'SUCCESS', false, 'SUCCESS', {
      totalAtomList: atomList,
      // mustAtomList,
      // wantAtomList,
    });
  }
}
