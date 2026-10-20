export abstract class HashService {
    abstract gerar(texto: string): Promise<string>;
    abstract comparar(texto: string, hash: string): Promise<boolean>;
}