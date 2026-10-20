import 'reflect-metadata';

const METADADO_MENSAGEM_VINCULO = Symbol('persistencia:mensagem-vinculo');

/**
 * Define a mensagem do `ConflictError` lançado quando a remoção falha porque
 * outro registro ainda aponta para este (chave estrangeira com `RESTRICT`).
 */
export function MensagemVinculo(mensagem: string): ClassDecorator {
  return (classe) => Reflect.defineMetadata(METADADO_MENSAGEM_VINCULO, mensagem, classe);
}

export function lerMensagemVinculo(classe: Function): string {
  return (
    Reflect.getMetadata(METADADO_MENSAGEM_VINCULO, classe) ??
    'Registro está vinculado a outros registros'
  );
}
