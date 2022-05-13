import { AtomType } from 'src/atom/atom-type.enum';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Routain } from './routain.entity';
import { RoutainAtomPair } from './routain_atom_pair.entity';
import { User } from './user.entity';

@Entity()
export class Atom extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  text: string;

  @Column()
  type: AtomType;

  @OneToMany((type) => RoutainAtomPair, (pair) => pair.atom, {
    nullable: true,
    cascade: true,
  })
  routainList: Routain[];

  @ManyToOne((type) => User, (user) => user.atomList)
  registeredUser: User;

  @CreateDateColumn()
  createdDate: Date;
}
