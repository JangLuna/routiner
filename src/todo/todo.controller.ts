import { Controller, Get, Render } from '@nestjs/common';
import { TodoService } from './todo.service';

@Controller('todo')
export class TodoController {
  constructor(private todoSerivce: TodoService) {}

  @Get('/')
  @Render('todo')
  async routain() {}
}
