import { HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from 'src/dto/create-user.dto';
import { ResponseDto } from 'src/dto/response.dto';
import { User } from 'src/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<ResponseDto> {
    let { id, passcode, name } = createUserDto;

    let count = await this.userRepository.count({ where: { id } });

    if (count > 0) {
      return new ResponseDto(
        HttpStatus.CONFLICT,
        'ALREADY_EXIST_ID',
        true,
        'ALREADY_EXIST_ID',
      );
    }

    const salt = await bcrypt.genSalt();
    const hasedPassCode = await bcrypt.hash(passcode, salt);

    let user: User = this.userRepository.create({
      id,
      passcode: hasedPassCode,
      name,
    });

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      user = await this.userRepository.save(user);

      await queryRunner.commitTransaction();
      return new ResponseDto(200, 'SUCCESS', false, 'SUCCESS', user);
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

  async deleteUser() {}

  async login() {}

  async logout() {}
}
