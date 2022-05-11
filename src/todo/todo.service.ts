import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Todo } from 'src/entities/todo.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TodoService {
  constructor(
    @InjectRepository(Todo)
    private routainRepository: Repository<Todo>,
  ) {}

  async createTodo() {}

  async failTodo() {}

  async deleteTodo() {}

  async doneTodo() {}
}
