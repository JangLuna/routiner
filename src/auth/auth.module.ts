import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PhoneVerification } from 'src/entities/phone_verification.entity';
import { Routain } from 'src/entities/routain.entity';
import { User } from 'src/entities/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.stratege';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  imports: [
    TypeOrmModule.forFeature([User, Routain, PhoneVerification]),
    JwtModule.registerAsync({
      // .env 에 등록되어 있는 것을 가져오는것이 비동기 작업이므로, 초기화 시에 env 요소를 못불러온 상태일 수 있음.
      // 따라서 registerAsync, ConfigService 를 사용해 동기적으로 작업함
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '14d'
        }
      })
    }),
    PassportModule.register({ defaultStrategy: 'jwt' })
  ],
  exports: [JwtStrategy, PassportModule]
})
export class AuthModule {}
