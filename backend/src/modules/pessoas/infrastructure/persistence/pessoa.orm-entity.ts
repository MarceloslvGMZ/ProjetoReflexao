import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { TIPOS_PESSOA, type TipoPessoa } from '../../domain/pessoa.js';

@Entity('pessoa')
export class PessoaOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nome: string;

  @Column({ length: 11, unique: true })
  cpf: string;

  @Column({ type: 'simple-enum', enum: TIPOS_PESSOA })
  tipo: TipoPessoa;

  @Column({ type: 'varchar', nullable: true, unique: true })
  matricula: string | null;
}
