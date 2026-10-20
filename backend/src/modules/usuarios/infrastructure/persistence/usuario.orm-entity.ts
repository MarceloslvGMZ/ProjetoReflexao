import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TIPOS_PESSOA } from '../../../pessoas/domain/pessoa.js';
import { PessoaOrmEntity } from '../../../pessoas/infrastructure/persistence/pessoa.orm-entity.js';
import type { Perfil } from '../../domain/usuario.js';

@Entity('usuarios')
export class UsuarioOrmEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    pessoaId: number;

    @OneToOne(() => PessoaOrmEntity, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'pessoaId' })
    pessoa: PessoaOrmEntity;

    @Column({ length: 30, unique: true })
    usuario: string;

    @Column()
    senhaHash: string;

    @Column({ type: 'simple-enum', enum: TIPOS_PESSOA })
    perfil: Perfil;

    @Column({ default: true })
    ativo: boolean;
}