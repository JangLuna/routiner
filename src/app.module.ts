import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AtomModule } from './atom/atom.module';
import { RoutainModule } from './routain/routain.module';
import { TodoModule } from './todo/todo.module';

@Module({
  imports: [AtomModule, RoutainModule, TodoModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
