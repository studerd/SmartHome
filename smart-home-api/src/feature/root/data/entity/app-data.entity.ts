import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { Credential } from '@security';

@Entity()
export class AppData {
  @PrimaryColumn('varchar', { length: 26 })
  app_id: string;

  @Column({ default: false })
  isInitialized: boolean;

  /** Relation One-to-One propriétaire */
  @OneToOne(() => Credential,{eager:true})
  @JoinColumn({ name: 'super_admin_id', referencedColumnName: 'credential_id'})
  superAdmin?: Credential;
}