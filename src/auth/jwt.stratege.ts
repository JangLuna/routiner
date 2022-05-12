import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';

// JWTStrategy가 필요하면 인젝션 할 수 있도록 @Injectable 데코레이터 사용
@Injectable()

// PassportStrategy 클래스는 @nestjs/passport 패키지에 정의되어있음.
// PassportStrategy(Strategy) 의 Strategy는 passport-jwt 패키지에 정의되어있는 JWT Strategy 임
export class JwtStrategy extends PassportStrategy(Strategy) {
  // 유효한 토큰일 경우 DB로부터 유저 정보 가져와야 하기 때문
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {
    // 유효한 토큰인지 확인
    super({
      // 유효성 검증과 페이로드 액세스에 필요함
      secretOrKey: process.env.JWT_SECRET,

      // 현재 요청의 인증 헤더에서 Bearer token 으로 넘겨진 JWT 를 찾는 설정
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  // Passport 는 각 strategy 마다 validate 메소드를 call함.
  // 토큰이 유효한치 체크가 완료되면 validate 메소드가 살행됨.
  async validate(payload) {
    const { id, name } = payload;
    const user: User = await this.userRepository.findOne({ id, name });

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
