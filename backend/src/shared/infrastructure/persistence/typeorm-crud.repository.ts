import { DeepPartial, FindOptionsOrder, FindOptionsWhere, ObjectLiteral, Repository } from 'typeorm';
import { ConflictError } from '../../domain/errors.js';
import { lerMensagemVinculo } from './mensagem-vinculo.decorator.js';
import { violouChaveEstrangeira } from './violou-chave-estrangeira.js';

type EntidadeDeDominio = { id: number | null };

/**
 * Base dos adaptadores TypeORM. A conversão domínio ⇄ banco é feita em tempo de
 * execução: as colunas são lidas dos metadados que o TypeORM monta a partir dos
 * decorators `@Column` da entidade ORM, então não é preciso um mapper por módulo.
 * Exige que a entidade de domínio e a ORM usem os mesmos nomes de campos.
 */
export abstract class TypeOrmCrudRepository<
  TDominio extends EntidadeDeDominio,
  TOrm extends ObjectLiteral & { id: number },
> {
  protected readonly ordemPadrao: FindOptionsOrder<TOrm> = { id: 'ASC' } as FindOptionsOrder<TOrm>;

  protected constructor(
    protected readonly repository: Repository<TOrm>,
    /** Normalmente o `restaurar` da entidade; o tipo garante que a ORM tem os campos que o domínio espera. */
    private readonly restaurar: (id: number, orm: TOrm) => TDominio,
  ) {}

  async salvar(entidade: TDominio): Promise<TDominio> {
    return this.paraDominio(await this.repository.save(this.paraOrm(entidade)));
  }

  async buscarPorId(id: number): Promise<TDominio | null> {
    return this.buscarUmPor({ id } as FindOptionsWhere<TOrm>);
  }

  async listar(): Promise<TDominio[]> {
    const lista = await this.repository.find({ order: this.ordemPadrao });
    return lista.map((orm) => this.paraDominio(orm));
  }

  async remover(id: number): Promise<void> {
    try {
      await this.repository.delete(id);
    } catch (error) {
      if (violouChaveEstrangeira(error)) {
        throw new ConflictError(lerMensagemVinculo(this.constructor));
      }
      throw error;
    }
  }

  protected async buscarUmPor(where: FindOptionsWhere<TOrm>): Promise<TDominio | null> {
    const orm = await this.repository.findOneBy(where);
    return orm ? this.paraDominio(orm) : null;
  }

  protected paraDominio(orm: TOrm): TDominio {
    return this.restaurar(orm.id, orm);
  }

  protected paraOrm(entidade: TDominio): TOrm {
    const valores: Record<string, unknown> = {};
    for (const coluna of this.repository.metadata.columns) {
      const valor = (entidade as Record<string, unknown>)[coluna.propertyName];
      if (valor !== null || !coluna.isPrimary) valores[coluna.propertyName] = valor;
    }
    return this.repository.create(valores as DeepPartial<TOrm>);
  }
}
