import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class PhoneVerification extends BaseEntity {
  @PrimaryGeneratedColumn()
  idx: number;

  @Column()
  phone: string;

  @Column()
  verification_code: string;

  @Column()
  expired_date: Date;

  @Column()
  is_expired: number;
}
