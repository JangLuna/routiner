import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Routain } from './routain.entity';
import { User } from './user.entity';

@Entity()
export class Atom extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  text: string;

  @Column()
  type: boolean;

  @ManyToOne((type) => Routain, (routain) => routain.atomList)
  routain: Routain;

  @ManyToOne((type) => User, (user) => user.atomList)
  registeredUser: User;
}
