import { HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from 'src/dto/create-user.dto';
import { ResponseDto } from 'src/dto/response.dto';
import { User } from 'src/entities/user.entity';
import { getConnection, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { SignInDto } from 'src/dto/sign-in.dto';
import { JwtService } from '@nestjs/jwt';
import { Routain } from 'src/entities/routain.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Routain)
    private routainRepository: Repository<Routain>,

    private jwtService: JwtService
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<ResponseDto> {
    let { id, passcode, name } = createUserDto;

    let count = await this.userRepository.count({ where: { id } });

    if (count > 0) {
      return new ResponseDto(
        HttpStatus.CONFLICT,
        'ALREADY_EXIST_ID',
        true,
        'ALREADY_EXIST_ID'
      );
    }

    const salt = await bcrypt.genSalt();
    const hasedPassCode = await bcrypt.hash(passcode, salt);

    let user: User = this.userRepository.create({
      id,
      passcode: hasedPassCode,
      name
    });

    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      user = await queryRunner.manager.save(user);

      await queryRunner.commitTransaction();
      return new ResponseDto(200, 'SUCCESS', false, 'SUCCESS', user);
    } catch (e) {
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

  async deleteUser() {}

  async login(signInDto: SignInDto): Promise<ResponseDto> {
    let { id, passcode } = signInDto;

    const user: User = await this.userRepository.findOne({ id });

    if (!user) {
      return new ResponseDto(
        HttpStatus.UNAUTHORIZED,
        'NOT_EXIST_USER',
        true,
        'NOT_EXIST_USER'
      );
    } else {
      if (!(await bcrypt.compare(passcode, user.passcode))) {
        return new ResponseDto(
          HttpStatus.UNAUTHORIZED,
          'NOT_EXIST_USER',
          true,
          'NOT_EXIST_USER'
        );
      } else {
        let token = await this.jwtService.sign({
          id,
          name: user.name
        });

        return new ResponseDto(
          HttpStatus.ACCEPTED,
          'SIGN_IN_SUCCESS',
          false,
          'SIGN_IN_SUCCESS',
          { token: token }
        );
      }
    }
  }

  async verifyToken(token: string) {
    let payload = await this.jwtService.verify(token);
    let expireDate = new Date(0);
    expireDate.setUTCSeconds(payload['exp']);

    let user: User = await this.userRepository.findOne({
      where: {
        id: payload['id'],
        name: payload['name']
      }
    });

    let routain: Routain = await this.routainRepository.findOne({
      where: {
        registeredUser: user,
        isUse: true
      }
    });

    let expired = expireDate < new Date();
    let response = {
      expired,
      name: user.name
    };

    if (!expired && routain != undefined) {
      delete routain.registeredUser;
      response['routain'] = routain;
    }

    return response;
  }
}
