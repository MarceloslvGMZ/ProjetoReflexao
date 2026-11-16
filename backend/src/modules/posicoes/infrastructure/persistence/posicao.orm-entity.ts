import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('posicoes')
export class PosicaoOrmEntity {
  @PrimaryColumn()
  onibusId: number;

  @Column('real')
  latitude: number;

  @Column('real')
  longitude: number;

  @Column({ type: 'timestamptz' })
  atualizadoEm: Date;

  @Column()
  usuarioId: number;
}
