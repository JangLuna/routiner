import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ResponseDto } from 'src/dto/response.dto';
import { RoutainLog } from 'src/entities/routain-log.entity';
import { Routain } from 'src/entities/routain.entity';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RoutainService {
  constructor(
    @InjectRepository(Routain)
    private routainRepository: Repository<Routain>,

    @InjectRepository(RoutainLog)
    private routainLogRepository: Repository<RoutainLog>,
  ) {}

  async createRoutain() {}

  async deleteRoutain() {}

  async startRoutain() {}

  async stopRoutain() {}

  async editRoutain() {}

  async getRoutainList(user: User): Promise<ResponseDto> {
    let routainList = await this.routainRepository.find({
      where: { registeredUser: user },
    });

    return new ResponseDto(HttpStatus.ACCEPTED, 'SUCCESS', false, 'SUCCESS', {
      routainList,
    });
  }
}
