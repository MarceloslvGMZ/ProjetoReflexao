import { DomainError } from '../../../shared/domain/errors.js';

export interface DadosOnibus {
  placa: string;
  modelo: string;
  ano: number;
  capacidade: number;
}

const ANO_MINIMO = 1970;
// Aceita o formato antigo (ABC1234) e o Mercosul (ABC1D23).
const FORMATO_PLACA = /^[A-Z]{3}\d[A-Z0-9]\d{2}$/;

export class Onibus {
  private constructor(
    public readonly id: number | null,
    public placa: string,
    public modelo: string,
    public ano: number,
    public capacidade: number,
  ) {}

  static criar(dados: DadosOnibus): Onibus {
    const validos = Onibus.validar(dados);
    return new Onibus(null, validos.placa, validos.modelo, validos.ano, validos.capacidade);
  }

  // Reconstrói um ônibus que já está salvo; os dados já foram validados ao serem gravados.
  static restaurar(id: number, dados: DadosOnibus): Onibus {
    return new Onibus(id, dados.placa, dados.modelo, dados.ano, dados.capacidade);
  }

  atualizar(dados: DadosOnibus): void {
    const validos = Onibus.validar(dados);
    this.placa = validos.placa;
    this.modelo = validos.modelo;
    this.ano = validos.ano;
    this.capacidade = validos.capacidade;
  }

  private static validar(dados: DadosOnibus): DadosOnibus {
    const placa = dados.placa.trim().toUpperCase().replace('-', '');
    if (!FORMATO_PLACA.test(placa)) {
      throw new DomainError('Placa inválida. Use o formato ABC1234 ou ABC1D23');
    }

    const modelo = dados.modelo.trim();
    if (!modelo) throw new DomainError('Modelo é obrigatório');

    const anoMaximo = new Date().getFullYear() + 1;
    if (!Number.isInteger(dados.ano) || dados.ano < ANO_MINIMO || dados.ano > anoMaximo) {
      throw new DomainError(`Ano deve estar entre ${ANO_MINIMO} e ${anoMaximo}`);
    }

    if (!Number.isInteger(dados.capacidade) || dados.capacidade < 1) {
      throw new DomainError('Capacidade deve ser um número inteiro maior que zero');
    }

    return { placa, modelo, ano: dados.ano, capacidade: dados.capacidade };
  }
}
