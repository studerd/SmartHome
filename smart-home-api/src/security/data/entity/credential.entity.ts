import { BeforeInsert, Column, CreateDateColumn, Entity, PrimaryColumn, ValueTransformer } from 'typeorm';
import { ulid } from 'ulid';



@Entity()
export class Credential {
  @PrimaryColumn('varchar', { length: 26})
  credential_id: string;
  @Column({ nullable: false, unique: true })
  username: string;
  @Column({ nullable: true })
  password: string;
  @Column({ nullable: false, unique: true })
  mail: string;
  @Column({ default: false })
  isAdmin: boolean;
  @Column({ default: true })
  active: boolean;
  @CreateDateColumn()
  created: Date;
  @CreateDateColumn()
  updated: Date;
  // Empreinte biométrique (embedding 512-D) – stockée en JSON (portable)
  @Column({ name: 'biometric_data', type: 'jsonb', nullable: true }) // 'json' si pas Postgres
  biometricData: number[]
}