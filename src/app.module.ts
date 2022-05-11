import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AtomModule } from './atom/atom.module';
import { typeORMConfig } from './configs/typeorm.config';
import { Atom } from './entities/atom.entity';
import { RoutainLog } from './entities/routain-log.entity';
import { Routain } from './entities/routain.entity';
import { Todo } from './entities/todo.entity';
import { RoutainModule } from './routain/routain.module';
import { TodoModule } from './todo/todo.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    AtomModule,
    RoutainModule,
    TodoModule,
    TypeOrmModule.forRoot(typeORMConfig),
    TypeOrmModule.forFeature([Routain, RoutainLog, Todo, Atom]),
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
