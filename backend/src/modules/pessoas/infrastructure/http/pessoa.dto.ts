import { Campo } from '../../../../shared/infrastructure/http/formulario/campo.decorator.js';
import { TIPOS_PESSOA, type TipoPessoa } from '../../domain/pessoa.js';

export class PessoaDto {
  @Campo({ rotulo: 'Nome' })
  nome: string;

  @Campo({ rotulo: 'CPF', exemplo: '529.982.247-25' })
  cpf: string;

  @Campo({ rotulo: 'Tipo', opcoes: TIPOS_PESSOA })
  tipo: TipoPessoa;

  @Campo({
    rotulo: 'Matrícula',
    opcional: true,
    obrigatorioSe: { campo: 'tipo', igual: 'ESTUDANTE' },
    ajuda: 'Obrigatória para estudantes e proibida para os demais tipos',
  })
  matricula?: string;
}
