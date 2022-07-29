import { RoutainBehaviorType } from 'src/routain/routain-behavior.enum';
import { RoutainService } from 'src/routain/routain.service';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { Routain } from './routain.entity';

@Entity()
export class RoutainLog extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne((type) => Routain, (routain) => routain.logList, {
    onDelete: 'CASCADE'
  })
  routain: Routain;

  @Column({ nullable: false })
  behaviorType: RoutainBehaviorType;

  @CreateDateColumn()
  createdDate: Date;

  @UpdateDateColumn()
  updateDate: Date;
}
