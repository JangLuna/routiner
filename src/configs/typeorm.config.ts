import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const typeORMConfig: TypeOrmModuleOptions = {
  //DataBase Type
  type: 'mariadb',
  host: 'sidetrack-vflo.cwel20rl0x36.us-east-1.rds.amazonaws.com',
  port: 3306,
  username: 'sidetrackmaster',
  password: 'sidetrack0202',
  database: 'Routainer',

  //Entities to be loaded for this connections
  entities: [__dirname + '/../**/*.entity.{js,ts}'],

  synchronize: true,
};
