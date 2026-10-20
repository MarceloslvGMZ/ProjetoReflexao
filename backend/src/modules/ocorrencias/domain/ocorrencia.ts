import { DomainError } from '../../../shared/domain/errors.js';

export interface DadosOcorrencia {
  titulo: string;
  descricao: string;
  dataHora: Date;
  usuarioId: number;
  onibusId: number;
  rotaId: number;
}

/** Campos que podem ser alterados depois do registro (o autor não muda). */
export type DadosAtualizacaoOcorrencia = Omit<DadosOcorrencia, 'usuarioId'>;

const TAMANHO_MAXIMO_TITULO = 100;

export class Ocorrencia {
  private constructor(
    public readonly id: number | null,
    public titulo: string,
    public descricao: string,
    public dataHora: Date,
    public readonly usuarioId: number,
    public onibusId: number,
    public rotaId: number,
  ) {}

  static criar(dados: DadosOcorrencia, agora = new Date()): Ocorrencia {
    const v = Ocorrencia.validar(dados, agora);
    return new Ocorrencia(
      null,
      v.titulo,
      v.descricao,
      v.dataHora,
      dados.usuarioId,
      dados.onibusId,
      dados.rotaId,
    );
  }

  static restaurar(id: number, dados: DadosOcorrencia): Ocorrencia {
    return new Ocorrencia(
      id,
      dados.titulo,
      dados.descricao,
      new Date(dados.dataHora),
      dados.usuarioId,
      dados.onibusId,
      dados.rotaId,
    );
  }

  atualizar(dados: DadosAtualizacaoOcorrencia, agora = new Date()): void {
    const v = Ocorrencia.validar(dados, agora);
    this.titulo = v.titulo;
    this.descricao = v.descricao;
    this.dataHora = v.dataHora;
    this.onibusId = dados.onibusId;
    this.rotaId = dados.rotaId;
  }

  private static validar(dados: DadosAtualizacaoOcorrencia, agora: Date) {
    const titulo = dados.titulo.trim();
    const descricao = dados.descricao.trim();
    if (!titulo) throw new DomainError('Título é obrigatório');
    if (titulo.length > TAMANHO_MAXIMO_TITULO) {
      throw new DomainError(`Título deve ter no máximo ${TAMANHO_MAXIMO_TITULO} caracteres`);
    }
    if (!descricao) throw new DomainError('Descrição é obrigatória');

    const dataHora = new Date(dados.dataHora);
    if (Number.isNaN(dataHora.getTime())) throw new DomainError('Data e hora inválidas');
    if (dataHora > agora) throw new DomainError('A ocorrência não pode estar no futuro');

    return { titulo, descricao, dataHora };
  }
}
