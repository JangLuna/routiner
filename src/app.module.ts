import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AtomModule } from './atom/atom.module';
import { Atom } from './entities/atom.entity';
import { RoutainLog } from './entities/routain-log.entity';
import { Routain } from './entities/routain.entity';
import { Todo } from './entities/todo.entity';
import { RoutainModule } from './routain/routain.module';
import { TodoModule } from './todo/todo.module';
import { AuthModule } from './auth/auth.module';
import { ConfigurationModule } from './configuration/configuration.module';
import { RoutainDetailModule } from './routain-detail/routain-detail.module';

@Module({
  imports: [
    AtomModule,
    RoutainModule,
    TodoModule,
    TypeOrmModule.forRoot({
      type: 'mariadb',
      host: process.env.DB_ENDPOINT,
      port: 3306,
      username: process.env.DB_USER,
      password: process.env.DB_PW,
      database: 'routainer',
      entities: [__dirname + '/**/*.entity.{js,ts}'],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Routain, RoutainLog, Todo, Atom]),
    AuthModule,
    ConfigurationModule,
    RoutainDetailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
