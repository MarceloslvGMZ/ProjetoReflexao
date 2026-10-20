import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { Campo, lerCampos } from './campo.decorator.js';

class ExemploDto {
  @Campo({ rotulo: 'Nome' })
  nome: string;

  @Campo({ rotulo: 'Idade', opcional: true })
  idade?: number;

  @Campo({ rotulo: 'Ativo' })
  ativo: boolean;

  @Campo({ rotulo: 'Turno', opcoes: ['MANHA', 'NOITE'] })
  turno: string;

  @Campo({ rotulo: 'Senha', tipo: 'senha' })
  senha: string;
}

async function erros(dados: object) {
  const resultado = await validate(plainToInstance(ExemploDto, dados));
  return resultado.map((erro) => erro.property);
}

describe('@Campo', () => {
  it('descreve os campos inferindo o tipo por reflexão', () => {
    expect(lerCampos(ExemploDto)).toEqual([
      { nome: 'nome', rotulo: 'Nome', tipo: 'texto', obrigatorio: true },
      { nome: 'idade', rotulo: 'Idade', tipo: 'numero', obrigatorio: false },
      { nome: 'ativo', rotulo: 'Ativo', tipo: 'booleano', obrigatorio: true },
      { nome: 'turno', rotulo: 'Turno', tipo: 'selecao', obrigatorio: true, opcoes: ['MANHA', 'NOITE'] },
      { nome: 'senha', rotulo: 'Senha', tipo: 'senha', obrigatorio: true },
    ]);
  });

  it('aplica as validações do tipo inferido', async () => {
    const valido = { nome: 'Ana', ativo: true, turno: 'MANHA', senha: 'x' };

    expect(await erros(valido)).toEqual([]);
    expect(await erros({ ...valido, nome: '' })).toEqual(['nome']);
    expect(await erros({ ...valido, idade: 'dez' })).toEqual(['idade']);
    expect(await erros({ ...valido, ativo: 'sim' })).toEqual(['ativo']);
    expect(await erros({ ...valido, turno: 'TARDE' })).toEqual(['turno']);
  });

  it('falha ao carregar quando o tipo não pode ser inferido', () => {
    expect(() => {
      class Invalido {
        @Campo({ rotulo: 'Data' })
        data: Date;
      }
      return Invalido;
    }).toThrow('@Campo: não foi possível inferir o tipo de Invalido.data');
  });
});
