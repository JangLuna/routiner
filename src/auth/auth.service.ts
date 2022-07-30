import {
  ConflictException,
  ForbiddenException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException
} from '@nestjs/common';
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
import * as crypto from 'crypto';
import { NCPSmsResposne } from 'src/dto/NCP-sms-response.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Routain)
    private routainRepository: Repository<Routain>,

    @InjectRepository(PhoneVerification)
    private phoneVerificationRepository: Repository<PhoneVerification>,

    private jwtService: JwtService
  ) {}

  async sendVerificationSMS(phone: string): Promise<ResponseDto> {
    console.log('sms sevice called');

    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const verificationCodeList = await this.phoneVerificationRepository.find({
        where: { phone: phone }
      });

      // 당일 요청 5건 이상 금지
      const sameDayVerificationRequest = verificationCodeList.filter((v) => {
        let date = v.expired_date;
        let current = new Date();

        let dateString =
          date.getFullYear() + '' + date.getMonth() + '' + date.getDate();
        let currentString =
          current.getFullYear() +
          '' +
          current.getMonth() +
          '' +
          current.getDate();

        return dateString === currentString;
      });

      if (sameDayVerificationRequest.length > 4) {
        throw new ForbiddenException(
          new ResponseDto(
            HttpStatus.UNAUTHORIZED,
            'DAY_LIMIT_EXCEEDED',
            true,
            'The number of authentications allowed per day has been exceeded.'
          )
        );
      }

      // //이전에 발급 받은 코드들 모두 expire.
      verificationCodeList.forEach((v) => (v.is_expired = 1));
      await this.phoneVerificationRepository.save(verificationCodeList);

      // 해싱
      let verificationCode = Math.floor(100000 + Math.random() * 900000);
      let expiredDate = new Date();
      expiredDate.setMinutes(expiredDate.getMinutes() + 30);

      // DB 에 phone-verification code 저장
      const phoneVerfication: PhoneVerification =
        this.phoneVerificationRepository.create({
          phone: phone,
          verification_code: verificationCode.toString(),
          expired_date: expiredDate,
          is_expired: 0
        });

      const smsResult: Boolean = await this.sendVerifyMessage(
        phone,
        verificationCode.toString()
      );

      if (smsResult) {
        await queryRunner.manager.save(phoneVerfication);
        await queryRunner.commitTransaction();
        return new ResponseDto(
          HttpStatus.ACCEPTED,
          `Verification SMS is sent successfully.`,
          false,
          `Verification SMS is sent successfully.`,
          smsResult
        );
      } else {
        throw 'SMS send error on NCP';
      }
    } catch (e) {
      console.error(e);
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(
        new ResponseDto(
          HttpStatus.INTERNAL_SERVER_ERROR,
          'INTERNAL_SERVER_ERROR',
          true,
          'INTERNAL_SERVER_ERROR',
          e
        )
      );
    } finally {
      await queryRunner.release();
    }
  }

  async createUser(createUserDto: CreateUserDto): Promise<ResponseDto> {
    let { id, passcode, name, phoneNumber, verificationCode } = createUserDto;

    let count = await this.userRepository.count({ where: { id } });

    if (count > 0) {
      throw new ConflictException(
        new ResponseDto(
          HttpStatus.CONFLICT,
          'ALREADY_EXIST_ID',
          true,
          'ALREADY_EXIST_ID'
        )
      );
    }

    let verification: PhoneVerification =
      await this.phoneVerificationRepository.findOne({
        where: {
          phone: phoneNumber,
          verification_code: verificationCode,
          is_expired: 0
        },
        order: {
          expired_date: 'ASC'
        }
      });

    if (!verification) {
      throw new UnauthorizedException(
        new ResponseDto(
          HttpStatus.UNAUTHORIZED,
          'VERIFICATION_CODE_NOT_EXIST',
          true,
          'This is an un-generated verification code.'
        )
      );
    }

    verification.expired_date.setMinutes(
      verification.expired_date.getMinutes() - 15
    );
    if (
      verification.expired_date < new Date() ||
      verification.is_expired == 1
    ) {
      throw new UnauthorizedException(
        new ResponseDto(
          HttpStatus.UNAUTHORIZED,
          'VERIFICATION_CODE_EXPIRED',
          true,
          'Verification code is expired.'
        )
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
      throw new InternalServerErrorException(
        new ResponseDto(
          HttpStatus.INTERNAL_SERVER_ERROR,
          'INTERNAL_SERVER_ERROR',
          true,
          'INTERNAL_SERVER_ERROR',
          e
        )
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
      throw new UnauthorizedException(
        new ResponseDto(
          HttpStatus.UNAUTHORIZED,
          'NOT_EXIST_USER',
          true,
          'NOT_EXIST_USER'
        )
      );
    } else {
      if (!(await bcrypt.compare(passcode, user.passcode))) {
        throw new UnauthorizedException(
          new ResponseDto(
            HttpStatus.UNAUTHORIZED,
            'NOT_CORRECT_ID_OR_PW',
            true,
            'NOT_CORRECT_ID_OR_PW'
          )
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

  makeSignitureForSMS = (): string => {
    let message = '';
    const hmac = crypto.createHmac('sha256', process.env.NCP_API_SECRET);
    const timeStamp = Date.now().toString();
    const space = ' ';
    const newLine = '\n';
    const method = 'POST';
    message += method;
    message += space;
    message += `/sms/v2/services/${process.env.SENS_SERVICE_ID}/messages`;
    message += newLine;
    message += timeStamp;
    message += newLine;
    message += process.env.NCP_API_KEY;
    console.log(message);
    const signiture = hmac.update(message).digest('base64'); // string 으로 반환
    return signiture.toString();
  };

  sendVerifyMessage = async (
    phoneNumber: string,
    verifyCode: string
  ): Promise<Boolean> => {
    const body = {
      type: 'SMS',
      from: process.env.SENS_CALLING_NUMBER,
      content: `HOOPs verification Code : ${verifyCode}`,
      messages: [
        {
          to: phoneNumber
        }
      ]
    };

    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
      'x-ncp-iam-access-key': `${process.env.NCP_API_KEY}`,
      'x-ncp-apigw-timestamp': Date.now().toString(),
      'x-ncp-apigw-signature-v2': this.makeSignitureForSMS()
    }; // 문자 보내기 (url)

    const result = await axios.post(
      `https://sens.apigw.ntruss.com/sms/v2/services/${process.env.SENS_SERVICE_ID}/messages`,
      body,
      { headers }
    );

    if (result.hasOwnProperty('error')) {
      return false;
    } else {
      const response = new NCPSmsResposne(result);
      return response.statusCode == '202';
    }
  };
}
