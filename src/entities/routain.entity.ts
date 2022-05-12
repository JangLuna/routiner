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
import { RoutainAtomPair } from './routain_atom_pair.entity';
import { User } from './user.entity';

@Entity()
export class Routain extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany((type) => RoutainAtomPair, (pair) => pair.routain, {
    nullable: true,
    cascade: true,
  })
  atomList: Atom[];

  @Column({ nullable: true })
  atomOrderString: string;

  @OneToMany((type) => RoutainLog, (log) => log.routain)
  logList: RoutainLog[];

  @Column()
  isUse: boolean;

  @ManyToOne((type) => User, (user) => user.atomList)
  registeredUser: User;
}
