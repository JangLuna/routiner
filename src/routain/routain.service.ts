import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isIBAN } from 'class-validator';
import { CreateRoutainDto } from 'src/dto/create-routain.dto';
import { ResponseDto } from 'src/dto/response.dto';
import { UpdateRoutainDto } from 'src/dto/update-routain.dto';
import { Atom } from 'src/entities/atom.entity';
import { RoutainLog } from 'src/entities/routain-log.entity';
import { Routain } from 'src/entities/routain.entity';
import { RoutainAtomPair } from 'src/entities/routain_atom_pair.entity';
import { User } from 'src/entities/user.entity';
import { getConnection, Repository } from 'typeorm';

@Injectable()
export class RoutainService {
  constructor(
    @InjectRepository(Routain)
    private routainRepository: Repository<Routain>,

    @InjectRepository(RoutainLog)
    private routainLogRepository: Repository<RoutainLog>,

    @InjectRepository(RoutainAtomPair)
    private routainAtomPairRepository: Repository<RoutainAtomPair>,

    @InjectRepository(Atom)
    private atomRepository: Repository<Atom>,
  ) {}

  async createRoutain(
    user: User,
    createRoutainDto: CreateRoutainDto,
  ): Promise<ResponseDto> {
    let { name, atomIdList, isUse } = createRoutainDto;

    let count = await this.routainRepository.count({
      name,
      registeredUser: user,
    });

    if (count > 0) {
      return new ResponseDto(
        HttpStatus.CONFLICT,
        'ALREADY_EXIST_ROUTAIN',
        false,
        'ALREADY_EXIST_ROUTAIN',
      );
    }

    let parsedAtomIdList: number[] = atomIdList.trim().split(',').map(Number);

    let existAtomList: Atom[] = await this.atomRepository
      .createQueryBuilder()
      .whereInIds(parsedAtomIdList)
      .where({ registeredUser: user })
      .getMany();

    if (parsedAtomIdList.length != existAtomList.length) {
      return new ResponseDto(
        HttpStatus.NOT_FOUND,
        'UNREGISTERED_ATOM',
        false,
        'UNREGISTERED_ATOM',
      );
    }

    let routain = this.routainRepository.create({
      name: name,
      isUse,
      atomOrderString: atomIdList.trim(),
      registeredUser: user,
    });

    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 루틴 저장
      routain = await queryRunner.manager.save(routain);
      // 루틴에서 유저 정보 삭제
      delete routain.registeredUser;

      // 루틴-아톰 페어 리스트 생성
      let routainAtomPairList: RoutainAtomPair[] = [];
      for (let i in existAtomList) {
        let atom: Atom = existAtomList[i];
        let pair = this.routainAtomPairRepository.create({ routain, atom });
        routainAtomPairList.push(pair);
      }

      // 루틴-아톰 페어 리스트 저장
      routainAtomPairList = await queryRunner.manager.save(routainAtomPairList);

      await queryRunner.commitTransaction();
      return new ResponseDto(200, 'SUCCESS', false, 'SUCCESS', routain);
    } catch (e) {
      console.error(e);
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

  async deleteRoutain(user: User, routainId: number): Promise<ResponseDto> {
    let routain: Routain = await this.routainRepository.findOne({
      relations: ['registeredUser'],
      where: { id: routainId },
    });

    if (!routain) {
      return new ResponseDto(
        HttpStatus.NOT_FOUND,
        'UNREGISTERED_ROUTAIN',
        true,
        'UNREGISTERED_ROUTAIN',
      );
    }

    if (routain.registeredUser.idx !== user.idx) {
      return new ResponseDto(
        HttpStatus.UNAUTHORIZED,
        'NOT_ROUTAIN_OWNER',
        true,
        'NOT_ROUTAIN_OWNER',
      );
    }

    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await queryRunner.manager.delete(Routain, {
        id: routain.id,
      });
      await queryRunner.commitTransaction();
      return new ResponseDto(200, 'SUCCESS', false, 'SUCCESS', result);
    } catch (e) {
      console.error(e);
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

  async startRoutain() {}

  async stopRoutain() {}

  async editRoutain(user: User, updateRoutainDto: UpdateRoutainDto) {
    let { id, name, atomIdList, isUse } = updateRoutainDto;

    let routain: Routain = await this.routainRepository.findOne({
      relations: ['registeredUser'],
      where: { id },
    });

    if (!routain) {
      return new ResponseDto(
        HttpStatus.NOT_FOUND,
        'UNREGISTERED_ROUTAIN',
        true,
        'UNREGISTERED_ROUTAIN',
      );
    }

    if (routain.registeredUser.idx !== user.idx) {
      return new ResponseDto(
        HttpStatus.UNAUTHORIZED,
        'NOT_ROUTAIN_OWNER',
        true,
        'NOT_ROUTAIN_OWNER',
      );
    }

    // 이름이 빈 문자열 아닐 때만 변경
    routain.name = name.trim().length > 0 ? name : routain.name;
    routain.isUse = isUse;
    routain.atomOrderString = atomIdList.trim();

    // 아톰 파싱
    let parsedAtomIdList: number[] = atomIdList.trim().split(',').map(Number);

    let existAtomList: Atom[] = await this.atomRepository
      .createQueryBuilder()
      .whereInIds(parsedAtomIdList)
      .andWhere({ registeredUser: user })
      .getMany();

    if (parsedAtomIdList.length != existAtomList.length) {
      return new ResponseDto(
        HttpStatus.NOT_FOUND,
        'UNREGISTERED_ATOM',
        false,
        'UNREGISTERED_ATOM',
      );
    }

    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.save(routain);
      await queryRunner.manager.delete(RoutainAtomPair, { routain });

      // 루틴-아톰 페어 리스트 생성
      let routainAtomPairList: RoutainAtomPair[] = [];
      for (let i in existAtomList) {
        let atom: Atom = existAtomList[i];
        let pair = this.routainAtomPairRepository.create({ routain, atom });
        routainAtomPairList.push(pair);
      }

      // 루틴-아톰 페어 리스트 저장
      routainAtomPairList = await queryRunner.manager.save(routainAtomPairList);

      await queryRunner.commitTransaction();
    } catch (e) {
      console.error(e);
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

  async getIsUseRoutain(user: User): Promise<ResponseDto> {
    try {
      let inUseRoutain = await this.routainRepository.findOne({
        where: {
          registeredUser: user,
          isUse: true,
        },
      });

      return new ResponseDto(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'SUCCESS',
        false,
        'SUCCESS',
        { routain: inUseRoutain },
      );
    } catch (e) {
      return new ResponseDto(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'INTERNAL_SERVER_ERROR',
        true,
        'INTERNAL_SERVER_ERROR',
        e,
      );
    }
  }

  async getRoutainList(user: User): Promise<ResponseDto> {
    let routainList = await this.routainRepository.find({
      where: { registeredUser: user },
    });

    return new ResponseDto(HttpStatus.ACCEPTED, 'SUCCESS', false, 'SUCCESS', {
      routainList,
    });
  }
}
