import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Atom } from './atom.entity';
import { RoutainLog } from './routain-log.entity';
import { User } from './user.entity';

@Entity()
export class Routain extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  text: string;

  @OneToMany((type) => Atom, (atom) => atom.routain)
  atomList: Atom[];

  @OneToMany((type) => RoutainLog, (log) => log.routain)
  logList: RoutainLog[];

  @Column()
  isUse: boolean;

  @ManyToOne((type) => User, (user) => user.atomList)
  registeredUser: User;
}
