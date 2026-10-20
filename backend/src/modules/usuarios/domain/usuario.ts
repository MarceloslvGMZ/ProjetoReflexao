import { DomainError } from '../../../shared/domain/errors.js';
import type { TipoPessoa } from '../../pessoas/domain/pessoa.js';

export type Perfil = TipoPessoa;

export interface DadosUsuario {
    pessoaId: number;
    usuario: string;
    senhaHash: string;
    perfil: Perfil;
    ativo?: boolean;
}

const FORMATO_LOGIN = /^[a-z0-9._]{3,30}$/;

export class Usuario {
    private constructor(
        public readonly id: number | null,
        public readonly pessoaId: number,
        public usuario: string,
        public senhaHash: string,
        public readonly perfil: Perfil,
        public ativo: boolean,
    ) {}

    static criar(dados: DadosUsuario): Usuario {
        return new Usuario(
            null,
            dados.pessoaId,
            Usuario.normalizarLogin(dados.usuario),
            dados.senhaHash,
            dados.perfil,
            dados.ativo ?? true,
        )
    }

    static restaurar(id: number, dados: DadosUsuario): Usuario {
        return new Usuario(id, dados.pessoaId, Usuario.normalizarLogin(dados.usuario), dados.senhaHash, dados.perfil, dados.ativo ?? true);
    }

    static normalizarLogin(login: string): string {
        const normalizado = login.trim().toLowerCase();
        if(!FORMATO_LOGIN.test(normalizado)) {
            throw new DomainError('Usuário deve ter de 3 a 30 caracteres: letras, numeros, ponto ou sublinhado');
        }
        return normalizado;
    }

    static validarSenha(senha: string): void {
        if(senha.length < 8 || !/[A-Za-z]/.test(senha) || !/\d/.test(senha)) {
            throw new DomainError('A senha deve ter no mínimo 8 caracteres, com letras e numeros');
        }
    }

    atualizar(dados: {usuario: string, ativo: boolean}): void {
        this.usuario = Usuario.normalizarLogin(dados.usuario);
        this.ativo = dados.ativo;
    }

    alterarSenha(novoHash: string): void {
        this.senhaHash = novoHash;
    }
}