import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { OnibusOrmEntity } from '../../../onibus/infrastructure/persistence/onibus.orm-entity.js';
import { RotaOrmEntity } from '../../../rotas/infrastructure/persistence/rota.orm-entity.js';
import { UsuarioOrmEntity } from '../../../usuarios/infrastructure/persistence/usuario.orm-entity.js';

@Entity('ocorrencia')
export class OcorrenciaOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  titulo: string;

  @Column('text')
  descricao: string;

  @Column('datetime')
  dataHora: Date;

  @Column()
  usuarioId: number;

  @ManyToOne(() => UsuarioOrmEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'usuarioId' })
  usuario: UsuarioOrmEntity;

  @Column()
  onibusId: number;

  @ManyToOne(() => OnibusOrmEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'onibusId' })
  onibus: OnibusOrmEntity;

  @Column()
  rotaId: number;

  @ManyToOne(() => RotaOrmEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'rotaId' })
  rota: RotaOrmEntity;
}
