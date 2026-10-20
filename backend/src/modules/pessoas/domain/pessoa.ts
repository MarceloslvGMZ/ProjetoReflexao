import { DomainError } from '../../../shared/domain/errors.js';

export const TIPOS_PESSOA = ['MOTORISTA', 'ESTUDANTE', 'ADMINISTRADOR'] as const;
export type TipoPessoa = (typeof TIPOS_PESSOA)[number];

export interface DadosPessoa {
  nome: string;
  cpf: string;
  tipo: TipoPessoa;
  matricula?: string | null;
}

export class Pessoa {
  private constructor(
    public readonly id: number | null,
    public nome: string,
    public cpf: string,
    public readonly tipo: TipoPessoa,
    public matricula: string | null,
  ) {}

  static criar(dados: DadosPessoa): Pessoa {
    const validos = Pessoa.validar(dados);
    return new Pessoa(null, validos.nome, validos.cpf, validos.tipo, validos.matricula);
  }

  static restaurar(id: number, dados: DadosPessoa): Pessoa {
    return new Pessoa(id, dados.nome, dados.cpf, dados.tipo, dados.matricula ?? null);
  }

  atualizar(dados: DadosPessoa): void {
    // Trocar o tipo deixaria inconsistentes os vínculos já feitos (ex.: motorista de uma rota).
    if (dados.tipo !== this.tipo) {
      throw new DomainError('O tipo da pessoa não pode ser alterado');
    }
    const validos = Pessoa.validar(dados);
    this.nome = validos.nome;
    this.cpf = validos.cpf;
    this.matricula = validos.matricula;
  }

  private static validar(dados: DadosPessoa) {
    const nome = dados.nome.trim();
    if (!nome) throw new DomainError('Nome é obrigatório');

    const cpf = dados.cpf.replace(/\D/g, '');
    if (!cpfValido(cpf)) throw new DomainError('CPF inválido');

    if (!TIPOS_PESSOA.includes(dados.tipo)) {
      throw new DomainError(`Tipo deve ser um de: ${TIPOS_PESSOA.join(', ')}`);
    }

    const matricula = dados.matricula?.trim() || null;
    if (dados.tipo === 'ESTUDANTE' && !matricula) {
      throw new DomainError('Matrícula é obrigatória para estudantes');
    }
    if (dados.tipo !== 'ESTUDANTE' && matricula) {
      throw new DomainError('Apenas estudantes possuem matrícula');
    }

    return { nome, cpf, tipo: dados.tipo, matricula };
  }
}

function cpfValido(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;

  const digitoVerificador = (base: string) => {
    const soma = [...base].reduce((total, digito, i) => total + Number(digito) * (base.length + 1 - i), 0);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  return (
    digitoVerificador(cpf.slice(0, 9)) === Number(cpf[9]) &&
    digitoVerificador(cpf.slice(0, 10)) === Number(cpf[10])
  );
}
