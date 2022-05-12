import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Atom } from './atom.entity';
import { Routain } from './routain.entity';

@Entity()
export class RoutainAtomPair {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Routain, (routain) => routain.atomList, {
    onDelete: 'CASCADE',
  })
  routain: Routain;

  @ManyToOne(() => Atom, (atom) => atom.routainList, {
    onDelete: 'CASCADE',
  })
  atom: Atom;
}
