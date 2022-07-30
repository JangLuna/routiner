import {
  ConflictException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateAtomDto } from 'src/dto/create-atom.dto';
import { ResponseDto } from 'src/dto/response.dto';
import { Atom } from 'src/entities/atom.entity';
import { User } from 'src/entities/user.entity';
import { ResponseMessage } from 'src/enums/response-message.enum';
import { getConnection, Repository } from 'typeorm';
import { AtomType } from './atom-type.enum';

@Injectable()
export class AtomService {
  constructor(
    @InjectRepository(Atom)
    private atomRepository: Repository<Atom>
  ) {}

  async createAtom(
    user: User,
    createAtomDto: CreateAtomDto
  ): Promise<ResponseDto> {
    let { text, type } = createAtomDto;

    let count = await this.atomRepository.count({
      where: {
        registeredUser: user,
        text,
        type
      }
    });

    if (count > 0) {
      throw new ConflictException(
        new ResponseDto(
          HttpStatus.CONFLICT,
          'ALREADY_EXIST_ATOM',
          true,
          ResponseMessage.ALREADY_EXIST_ATOM
        )
      );
    }

    let atom: Atom = this.atomRepository.create({
      text: text,
      type,
      registeredUser: user
    });

    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      atom = await queryRunner.manager.save(atom);
      await queryRunner.commitTransaction();

      delete atom.registeredUser;

      return new ResponseDto(
        HttpStatus.CREATED,
        'SUCCESS',
        false,
        'SUCCESS',
        atom
      );
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(
        new ResponseDto(
          HttpStatus.INTERNAL_SERVER_ERROR,
          'INTERNAL_SERVER_ERROR',
          true,
          ResponseMessage.INTERNAL_SERVER_ERROR,
          e
        )
      );
    } finally {
      await queryRunner.release();
    }
  }

  async deleteAtom(user: User, atomId: number): Promise<ResponseDto> {
    const atom = await this.atomRepository.findOne({
      relations: ['registeredUser', 'routainList'],
      where: { id: atomId }
    });

    if (!atom) {
      throw new NotFoundException(
        new ResponseDto(
          HttpStatus.NOT_FOUND,
          'UNREGISTERED_ATOM',
          true,
          ResponseMessage.UNREGISTERED_ATOM
        )
      );
    }

    if (atom.registeredUser.idx != user.idx) {
      throw new UnauthorizedException(
        new ResponseDto(
          HttpStatus.UNAUTHORIZED,
          'NOT_ATOM_OWNER',
          true,
          ResponseMessage.UNAUTHORIZED
        )
      );
    }

    if (atom.routainList.length > 0) {
      throw new InternalServerErrorException(
        new ResponseDto(
          HttpStatus.INTERNAL_SERVER_ERROR,
          'USING_ATOM',
          true,
          ResponseMessage.ATOM_IS_USING
        )
      );
    }

    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await queryRunner.manager.delete(Atom, { id: atom.id });
      await queryRunner.commitTransaction();
      return new ResponseDto(
        HttpStatus.OK,
        'SUCCESS',
        false,
        'SUCCESS',
        result
      );
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(
        new ResponseDto(
          HttpStatus.INTERNAL_SERVER_ERROR,
          'INTERNAL_SERVER_ERROR',
          true,
          ResponseMessage.INTERNAL_SERVER_ERROR,
          e
        )
      );
    } finally {
      await queryRunner.release();
    }
  }

  async getAtomList(user: User): Promise<ResponseDto> {
    const atomList = await this.atomRepository.find({
      where: { registeredUser: user },
      order: { createdDate: 'ASC' }
    });

    return new ResponseDto(HttpStatus.OK, 'SUCCESS', false, 'SUCCESS', {
      totalAtomList: atomList
    });
  }
}
