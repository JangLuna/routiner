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
import { PhoneVerification } from 'src/entities/phone_verification.entity';
import axios from 'axios';
import { SmsClient } from '@pickk/sens';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Routain)
    private routainRepository: Repository<Routain>,

    @InjectRepository(PhoneVerification)
    private emailVerificationRepository: Repository<PhoneVerification>,

    private jwtService: JwtService
  ) {}

  async createEmailVerificationCode(phone: string): Promise<ResponseDto> {
    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const verificationCodeCount =
        await this.emailVerificationRepository.count({
          where: { phone: phone }
        });

      // 이전에 요청했던 이력이 있다면
      if (verificationCodeCount > 0) {
        // 해당 이력 모두 삭제
        await queryRunner.manager.delete(PhoneVerification, {
          phone: phone
        });
      }

      // 해싱
      const salt = await bcrypt.genSalt();
      const hashedEmail = await bcrypt.hash(phone, salt);
      let expiredDate = new Date();
      expiredDate.setMinutes(expiredDate.getMinutes() + 30);

      // DB 에 email-verification code 저장
      const emailVerification: PhoneVerification =
        this.emailVerificationRepository.create({
          phone: phone,
          verification_code: hashedEmail,
          expired_date: expiredDate
        });

      await queryRunner.manager.save(emailVerification);
      await queryRunner.commitTransaction();

      const smsClient = new SmsClient({
        accessKey: process.env.NCP_API_KEY,
        secretKey: process.env.NCP_API_SECRET,
        smsServiceId: process.env.SENS_SERVICE_ID,
        callingNumber: process.env.SENS_CALLING_NUMBER
      });

      await smsClient
        .send({
          to: [phone],
          content: `Hoops Verification Code ` + hashedEmail.slice(0, 6)
        })
        .then((res) => console.log('success'));
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
    let payload = undefined;

    try {
      payload = await this.jwtService.verify(token);
    } catch (err) {
      throw new UnauthorizedException();
    }

    const expireDate = new Date(0);
    expireDate.setUTCSeconds(payload['exp']);

    const user: User = await this.userRepository.findOne({
      where: {
        id: payload['id'],
        name: payload['name']
      }
    });

    const routain: Routain = await this.routainRepository.findOne({
      where: {
        registeredUser: user,
        isUse: true
      }
    });

    const expired = expireDate < new Date();
    const response = {
      expired
    };

    if (!expired && routain != undefined) {
      delete routain.registeredUser;
      response['routain'] = routain;
    }

    return response;
  }
}
