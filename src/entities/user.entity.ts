import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Atom } from './atom.entity';
import { Routain } from './routain.entity';
import { Todo } from './todo.entity';

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  idx: number;

  @Column()
  name: string;

  @Column('text')
  passcode: string;

  @OneToMany((type) => Atom, (atom) => atom.registeredUser)
  atomList: Atom[];

  @OneToMany((type) => Routain, (routain) => routain.registeredUser)
  routainList: Routain[];

  @OneToMany((type) => Todo, (todo) => todo.registeredUser)
  todoList: Todo[];

  @CreateDateColumn()
  createdDate: Date;
}
