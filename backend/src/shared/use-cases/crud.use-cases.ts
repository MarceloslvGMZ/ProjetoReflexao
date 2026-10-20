import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '../domain/errors.js';

// Fábricas de casos de uso: cada módulo cria o seu com uma linha, informando a
// porta (token de injeção) e a mensagem de "não encontrado". Ex.:
//   export class BuscarOnibusUseCase extends BuscarPorIdUseCase(OnibusRepository, 'Ônibus não encontrado') {}

type Porta<T> = abstract new (...args: never[]) => T;

export interface PortaDeBusca<T> {
  buscarPorId(id: number): Promise<T | null>;
}

export interface PortaDeListagem<T> {
  listar(): Promise<T[]>;
}

export interface PortaDeRemocao<T> extends PortaDeBusca<T> {
  remover(id: number): Promise<void>;
}

export function BuscarPorIdUseCase<T>(porta: Porta<PortaDeBusca<T>>, mensagemNaoEncontrado: string) {
  @Injectable()
  class BuscarPorId {
    constructor(@Inject(porta) readonly repository: PortaDeBusca<T>) {}

    async executar(id: number): Promise<T> {
      const encontrado = await this.repository.buscarPorId(id);
      if (!encontrado) throw new NotFoundError(mensagemNaoEncontrado);
      return encontrado;
    }
  }
  return BuscarPorId;
}

export function ListarUseCase<T>(porta: Porta<PortaDeListagem<T>>) {
  @Injectable()
  class Listar {
    constructor(@Inject(porta) readonly repository: PortaDeListagem<T>) {}

    executar(): Promise<T[]> {
      return this.repository.listar();
    }
  }
  return Listar;
}

export function RemoverPorIdUseCase<T>(porta: Porta<PortaDeRemocao<T>>, mensagemNaoEncontrado: string) {
  @Injectable()
  class RemoverPorId {
    constructor(@Inject(porta) readonly repository: PortaDeRemocao<T>) {}

    async executar(id: number): Promise<void> {
      if (!(await this.repository.buscarPorId(id))) throw new NotFoundError(mensagemNaoEncontrado);
      await this.repository.remover(id);
    }
  }
  return RemoverPorId;
}
