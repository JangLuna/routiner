import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Routain } from './entities/routain.entity';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Routain)
    private routainRepository: Repository<Routain>,
  ) {}

  async getHello(): Promise<any> {
    return await this.routainRepository.find();
  }
}
