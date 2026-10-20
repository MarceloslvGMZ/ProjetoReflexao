// Base dos repositórios falsos usados nos testes unitários dos casos de uso.
// Devolve sempre cópias, como um banco faria, para alterações não vazarem para o que está "salvo".
export class InMemoryRepository<T extends { id: number | null }> {
  protected itens: T[] = [];
  private proximoId = 1;

  constructor(private readonly restaurar: (id: number, item: T) => T) {}

  async salvar(item: T): Promise<T> {
    const id = item.id ?? this.proximoId++;
    this.itens = [...this.itens.filter((atual) => atual.id !== id), this.restaurar(id, item)];
    return this.restaurar(id, item);
  }

  async buscarPorId(id: number): Promise<T | null> {
    return this.buscarUm((item) => item.id === id);
  }

  async listar(): Promise<T[]> {
    return this.filtrar(() => true);
  }

  async remover(id: number): Promise<void> {
    this.itens = this.itens.filter((item) => item.id !== id);
  }

  protected buscarUm(condicao: (item: T) => boolean): T | null {
    const item = this.itens.find(condicao);
    return item ? this.restaurar(item.id!, item) : null;
  }

  protected filtrar(condicao: (item: T) => boolean): T[] {
    return this.itens.filter(condicao).map((item) => this.restaurar(item.id!, item));
  }
}
