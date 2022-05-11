import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RoutainLog } from 'src/entities/routain-log.entity';
import { Routain } from 'src/entities/routain.entity';
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
}
