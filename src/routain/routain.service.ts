import {
  HttpStatus,
  Injectable,
  InternalServerErrorException
} from '@nestjs/common';
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
import { RoutainDetailModule } from 'src/routain-detail/routain-detail.module';
import { getConnection, Repository } from 'typeorm';
import { RoutainBehaviorStatusType } from './routain-behavior-status.enum';
import { RoutainBehaviorType } from './routain-behavior.enum';

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
    private atomRepository: Repository<Atom>
  ) {}

  async createRoutain(
    user: User,
    createRoutainDto: CreateRoutainDto
  ): Promise<ResponseDto> {
    // 이름, 아톰리스트, 사용여부
    let { name, atomIdList, isUse } = createRoutainDto;

    // 중복이름 루틴 카운트
    let count = await this.routainRepository.count({
      name,
      registeredUser: user
    });

    // 중복된 이름 루틴 있을 떄 리턴
    if (count > 0) {
      return new ResponseDto(
        HttpStatus.CONFLICT,
        'ALREADY_EXIST_ROUTAIN',
        false,
        'ALREADY_EXIST_ROUTAIN'
      );
    }

    // atomIdList 를 , 제외하고 파싱한 number List
    let parsedAtomIdList: number[] = [];

    // parsedAtomIdList 를 기반으로 db 에서 가져온 아톰 리스트
    let existAtomList: Atom[] = [];
    if (atomIdList != undefined) {
      if (atomIdList.trim().length > 0) {
        parsedAtomIdList = atomIdList.trim().split(',').map(Number);
        existAtomList = await this.atomRepository
          .createQueryBuilder()
          .whereInIds(parsedAtomIdList)
          .andWhere({ registeredUser: user })
          .getMany();
      }

      console.log(parsedAtomIdList, existAtomList);

      // 그렇게 두 리스트가 길이가 같지 않을 떄 오류
      if (parsedAtomIdList.length != existAtomList.length) {
        return new ResponseDto(
          HttpStatus.NOT_FOUND,
          'UNREGISTERED_ATOM',
          false,
          'UNREGISTERED_ATOM'
        );
      }
    }

    let routain = this.routainRepository.create({
      name: name,
      isUse,
      atomOrderString: atomIdList != undefined ? atomIdList.trim() : '',
      registeredUser: user
    });

    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 루틴 저장
      routain = await queryRunner.manager.save(routain);
      // 루틴에서 유저 정보 삭제
      delete routain.registeredUser;

      // 루틴에 넣을 아톰리스트가 0개 이상일 떄
      // 루틴-아톰 페어 리스트 생성.
      if (existAtomList.length > 0) {
        let routainAtomPairList: RoutainAtomPair[] = [];
        for (let i in existAtomList) {
          let atom: Atom = existAtomList[i];
          let pair = this.routainAtomPairRepository.create({ routain, atom });
          routainAtomPairList.push(pair);
        }

        // 루틴-아톰 페어 리스트 저장
        routainAtomPairList = await queryRunner.manager.save(
          routainAtomPairList
        );
      }

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
        e
      );
    } finally {
      await queryRunner.release();
    }
  }

  async deleteRoutain(user: User, routainId: number): Promise<ResponseDto> {
    let routain: Routain = await this.routainRepository.findOne({
      relations: ['registeredUser'],
      where: { id: routainId }
    });

    if (!routain) {
      return new ResponseDto(
        HttpStatus.NOT_FOUND,
        'UNREGISTERED_ROUTAIN',
        true,
        'UNREGISTERED_ROUTAIN'
      );
    }

    if (routain.registeredUser.idx !== user.idx) {
      return new ResponseDto(
        HttpStatus.UNAUTHORIZED,
        'NOT_ROUTAIN_OWNER',
        true,
        'NOT_ROUTAIN_OWNER'
      );
    }

    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await queryRunner.manager.delete(Routain, {
        id: routain.id
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
        e
      );
    } finally {
      await queryRunner.release();
    }
  }

  async editRoutain(
    user: User,
    updateRoutainDto: UpdateRoutainDto
  ): Promise<ResponseDto> {
    let { id, name, atomIdList, isUse } = updateRoutainDto;

    let routain: Routain = await this.routainRepository.findOne({
      relations: ['registeredUser'],
      where: { id }
    });

    if (!routain) {
      return new ResponseDto(
        HttpStatus.NOT_FOUND,
        'UNREGISTERED_ROUTAIN',
        true,
        'UNREGISTERED_ROUTAIN'
      );
    }

    if (routain.registeredUser.idx !== user.idx) {
      return new ResponseDto(
        HttpStatus.UNAUTHORIZED,
        'NOT_ROUTAIN_OWNER',
        true,
        'NOT_ROUTAIN_OWNER'
      );
    }

    // 이름이 빈 문자열 아닐 때만 변경
    routain.name = name.trim().length > 0 ? name : routain.name;
    routain.isUse = isUse;
    routain.atomOrderString = atomIdList.trim();

    // 아톰 파싱
    let parsedAtomIdList: number[] = [];
    let existAtomList: Atom[] = [];
    if (atomIdList != undefined) {
      if (atomIdList.length > 0) {
        parsedAtomIdList = atomIdList.trim().split(',').map(Number);

        existAtomList = await this.atomRepository
          .createQueryBuilder()
          .whereInIds(parsedAtomIdList)
          .andWhere({ registeredUser: user })
          .getMany();
      }

      if (parsedAtomIdList.length != existAtomList.length) {
        return new ResponseDto(
          HttpStatus.NOT_FOUND,
          'UNREGISTERED_ATOM',
          false,
          'UNREGISTERED_ATOM'
        );
      }
    }

    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      routain = await queryRunner.manager.save(routain);
      await queryRunner.manager.delete(RoutainAtomPair, { routain });

      // 루틴-아톰 페어 리스트 생성
      if (existAtomList.length > 0) {
        let routainAtomPairList: RoutainAtomPair[] = [];
        for (let i in existAtomList) {
          let atom: Atom = existAtomList[i];
          let pair = this.routainAtomPairRepository.create({ routain, atom });
          routainAtomPairList.push(pair);
        }

        // 루틴-아톰 페어 리스트 저장
        routainAtomPairList = await queryRunner.manager.save(
          routainAtomPairList
        );
      }

      await queryRunner.commitTransaction();
      return new ResponseDto(HttpStatus.OK, 'SUCCESS', false, 'SUCCESS', {
        routain
      });
    } catch (e) {
      console.error(e);
      await queryRunner.rollbackTransaction();
      return new ResponseDto(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'INTERNAL_SERVER_ERROR',
        true,
        'INTERNAL_SERVER_ERROR',
        e
      );
    } finally {
      await queryRunner.release();
    }
  }

  async getIsUseRoutain(user: User): Promise<ResponseDto> {
    let inUseRoutain: Routain = undefined;
    let atomList: Atom[] = [];
    try {
      inUseRoutain = await this.routainRepository.findOne({
        where: {
          registeredUser: user,
          isUse: true
        }
      });

      atomList = await this.atomRepository.findByIds(
        inUseRoutain.atomOrderString.split(',')
      );
      console.log(atomList);
    } catch (e) {
      return new ResponseDto(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'INTERNAL_SERVER_ERROR',
        true,
        'INTERNAL_SERVER_ERROR',
        e
      );
    }

    if (inUseRoutain != undefined) {
      return new ResponseDto(HttpStatus.ACCEPTED, 'SUCCESS', false, 'SUCCESS', {
        routain: inUseRoutain,
        routain_atom_list: atomList
      });
    }
  }

  async setIsUseRoutain(user: User, routainId: number): Promise<ResponseDto> {
    let routainList: Routain[] = undefined;

    try {
      routainList = await this.routainRepository.find({
        where: {
          registeredUser: user
        }
      });
    } catch (e) {
      return new ResponseDto(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'INTERNAL_SERVER_ERROR',
        true,
        'INTERNAL_SERVER_ERROR',
        e
      );
    }

    if (routainList == undefined) {
      return new ResponseDto(
        HttpStatus.NOT_FOUND,
        'Routain is not found',
        true,
        'Routain is not found'
      );
    }

    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let prevIsUseRoutainList: Routain[] = routainList.filter(
        (v) => v.isUse == true
      );
      let newIsUseRoutainList: Routain[] = routainList.filter(
        (v) => v.id == routainId
      );

      if (prevIsUseRoutainList.length != 0) {
        await queryRunner.manager.query(`
          UPDATE routain
          SET isUse = 0
          WHERE id = ${prevIsUseRoutainList.pop().id}
        `);
      }

      await queryRunner.manager.query(`
          UPDATE routain
          SET isUse = 1
          WHERE id = ${newIsUseRoutainList.pop().id}
      `);

      await queryRunner.commitTransaction();
    } catch (e) {
      console.log(e);
      await queryRunner.rollbackTransaction();
      return new ResponseDto(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'INTERNAL_SERVER_ERROR',
        true,
        'INTERNAL_SERVER_ERROR',
        e
      );
    } finally {
      await queryRunner.release();
    }

    return new ResponseDto(
      HttpStatus.ACCEPTED,
      'SUCCESS',
      false,
      'SUCCESS',
      {}
    );
  }

  async getRoutainList(user: User): Promise<ResponseDto> {
    let routainList = await this.routainRepository.find({
      where: { registeredUser: user }
    });

    return new ResponseDto(HttpStatus.ACCEPTED, 'SUCCESS', false, 'SUCCESS', {
      routainList
    });
  }

  async getRoutain(user: User, id: number): Promise<ResponseDto> {
    let routain: Routain = await this.routainRepository.findOne({
      where: { registeredUser: user, id }
    });

    if (!routain) {
      return new ResponseDto(
        HttpStatus.NOT_FOUND,
        'UNREGISTRED_ATOM',
        true,
        'UNREGISTRED_ATOM'
      );
    } else {
      delete routain.registeredUser;

      return new ResponseDto(HttpStatus.OK, 'SUCCESS', false, 'SUCCESS', {
        routain
      });
    }
  }

  async startRoutain(user: User, routainId: number): Promise<ResponseDto> {
    const routain: Routain = await this.routainRepository.findOne({
      id: routainId
    });

    if (!routain) {
      return new ResponseDto(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'ROUTAIN_NOT_EXIST',
        true,
        'ROUTAIN_NOT_EXIST'
      );
    }

    if (routain.registeredUser != user) {
      return new ResponseDto(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'NOT_ROUTAIN_OWNER',
        true,
        'NOT_ROUTAIN_OWNER'
      );
    }

    if (routain.behaviorStatus == RoutainBehaviorStatusType.START) {
      return new ResponseDto(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'ALREADY_STARTED_ROUTAIN',
        true,
        'ALREADY_STARTED_ROUTAIN'
      );
    }

    const queryRunner = getConnection().createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const routainLog = this.routainLogRepository.create({
        routain: routain,
        behaviorType: RoutainBehaviorType.START
      });

      routain.behaviorStatus = RoutainBehaviorStatusType.START;

      await this.routainLogRepository.save(routainLog);
      await this.routainRepository.save(routain);

      await queryRunner.commitTransaction();
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(e, 'Routain start error occurred');
    } finally {
      await queryRunner.release();
    }
  }

  async stopRoutain(user: User, routainId: number): Promise<ResponseDto> {
    const routain: Routain = await this.routainRepository.findOne({
      id: routainId
    });

    if (!routain) {
      return new ResponseDto(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'ROUTAIN_NOT_EXIST',
        true,
        'ROUTAIN_NOT_EXIST'
      );
    }

    if (routain.registeredUser != user) {
      return new ResponseDto(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'NOT_ROUTAIN_OWNER',
        true,
        'NOT_ROUTAIN_OWNER'
      );
    }

    if (routain.behaviorStatus != RoutainBehaviorStatusType.START) {
      return new ResponseDto(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'ALREADY_STOPPED_ROUTAIN',
        true,
        'ALREADY_STOPPED_ROUTAIN'
      );
    }

    const queryRunner = getConnection().createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const routainLog = this.routainLogRepository.create({
        routain: routain,
        behaviorType: RoutainBehaviorType.STOP
      });

      routain.behaviorStatus = RoutainBehaviorStatusType.STOP;

      await this.routainLogRepository.save(routainLog);
      await this.routainRepository.save(routain);

      await queryRunner.commitTransaction();
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(e, 'Routain stop error occurred');
    } finally {
      await queryRunner.release();
    }
  }

  async skipRoutain(user: User, routainId: number): Promise<ResponseDto> {
    const routain: Routain = await this.routainRepository.findOne({
      id: routainId
    });

    if (!routain) {
      return new ResponseDto(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'ROUTAIN_NOT_EXIST',
        true,
        'ROUTAIN_NOT_EXIST'
      );
    }

    if (routain.registeredUser != user) {
      return new ResponseDto(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'NOT_ROUTAIN_OWNER',
        true,
        'NOT_ROUTAIN_OWNER'
      );
    }

    const queryRunner = getConnection().createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const routainLog = this.routainLogRepository.create({
        routain: routain,
        behaviorType: RoutainBehaviorType.SKIP
      });

      routain.behaviorStatus = RoutainBehaviorStatusType.STOP;

      await this.routainLogRepository.save(routainLog);
      await this.routainRepository.save(routain);

      await queryRunner.commitTransaction();
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(e, 'Routain skip error occurred');
    } finally {
      await queryRunner.release();
    }
  }
}
