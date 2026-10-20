import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { OnibusOrmEntity } from '../../../onibus/infrastructure/persistence/onibus.orm-entity.js';
import { PessoaOrmEntity } from '../../../pessoas/infrastructure/persistence/pessoa.orm-entity.js';
import { TURNOS, type Turno } from '../../domain/rota.js';

@Entity('rota')
export class RotaOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nome: string;

  @Column()
  origem: string;

  @Column()
  destino: string;

  @Column({ length: 5 })
  horarioSaidaIda: string;

  @Column({ length: 5 })
  horarioSaidaVolta: string;

  @Column({ type: 'simple-enum', enum: TURNOS })
  turno: Turno;

  @Column()
  onibusId: number;

  @ManyToOne(() => OnibusOrmEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'onibusId' })
  onibus: OnibusOrmEntity;

  @Column()
  motoristaId: number;

  @ManyToOne(() => PessoaOrmEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'motoristaId' })
  motorista: PessoaOrmEntity;

  @Column({ default: true })
  ativo: boolean;
}
