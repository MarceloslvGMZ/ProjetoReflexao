import type { DescricaoFormulario } from '../app/core/formularios/formulario.model';

/** Cópias das respostas de `GET /formularios/...` do backend, usadas nos testes. */

export const PESSOA_CRIAR: DescricaoFormulario = {
  recurso: 'pessoas',
  acao: 'criar',
  metodo: 'POST',
  caminho: '/pessoas',
  perfis: ['ADMINISTRADOR'],
  campos: [
    { nome: 'nome', rotulo: 'Nome', tipo: 'texto', obrigatorio: true },
    { nome: 'cpf', rotulo: 'CPF', tipo: 'texto', obrigatorio: true, exemplo: '529.982.247-25' },
    {
      nome: 'tipo',
      rotulo: 'Tipo',
      tipo: 'selecao',
      obrigatorio: true,
      opcoes: ['MOTORISTA', 'ESTUDANTE', 'ADMINISTRADOR'],
    },
    {
      nome: 'matricula',
      rotulo: 'Matrícula',
      tipo: 'texto',
      obrigatorio: false,
      obrigatorioSe: { campo: 'tipo', igual: 'ESTUDANTE' },
      ajuda: 'Obrigatória para estudantes e proibida para os demais tipos',
    },
  ],
};

export const PESSOA_ATUALIZAR: DescricaoFormulario = {
  ...PESSOA_CRIAR,
  acao: 'atualizar',
  metodo: 'PUT',
  caminho: '/pessoas/:id',
};

export const ROTA_CRIAR: DescricaoFormulario = {
  recurso: 'rotas',
  acao: 'criar',
  metodo: 'POST',
  caminho: '/rotas',
  perfis: ['ADMINISTRADOR'],
  campos: [
    { nome: 'nome', rotulo: 'Nome', tipo: 'texto', obrigatorio: true },
    { nome: 'turno', rotulo: 'Turno', tipo: 'selecao', obrigatorio: true, opcoes: ['MANHA'] },
    {
      nome: 'onibusId',
      rotulo: 'Ônibus',
      tipo: 'referencia',
      obrigatorio: true,
      referencia: { recurso: 'onibus', exibir: 'placa' },
    },
    { nome: 'ativo', rotulo: 'Ativa', tipo: 'booleano', obrigatorio: false },
  ],
};

export const OCORRENCIA_CRIAR: DescricaoFormulario = {
  recurso: 'ocorrencias',
  acao: 'criar',
  metodo: 'POST',
  caminho: '/ocorrencias',
  perfis: [],
  campos: [
    { nome: 'titulo', rotulo: 'Título', tipo: 'texto', obrigatorio: true },
    { nome: 'dataHora', rotulo: 'Data e hora', tipo: 'data-hora', obrigatorio: false },
    { nome: 'quantidade', rotulo: 'Quantidade', tipo: 'numero', obrigatorio: true },
  ],
};
