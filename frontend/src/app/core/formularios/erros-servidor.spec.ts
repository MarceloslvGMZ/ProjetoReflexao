import { PESSOA_CRIAR, ROTA_CRIAR } from '../../../testing/descricoes';
import { mapearErrosServidor } from './erros-servidor';

describe('mapearErrosServidor', () => {
  it('associa mensagens do ValidationPipe pelo nome da propriedade, traduzidas', () => {
    const { porCampo, gerais } = mapearErrosServidor(PESSOA_CRIAR, [
      'nome should not be empty',
      'tipo must be one of the following values: MOTORISTA, ESTUDANTE, ADMINISTRADOR',
    ]);

    expect(porCampo.get('nome')).toEqual(['Campo obrigatório.']);
    expect(porCampo.get('tipo')).toEqual(['Selecione uma das opções.']);
    expect(gerais).toEqual([]);
  });

  it('associa mensagens de domínio pelo rótulo do campo', () => {
    const { porCampo } = mapearErrosServidor(PESSOA_CRIAR, [
      'CPF inválido',
      'Matrícula é obrigatória para estudantes',
    ]);

    expect(porCampo.get('cpf')).toEqual(['CPF inválido']);
    expect(porCampo.get('matricula')).toEqual(['Matrícula é obrigatória para estudantes']);
  });

  it('associa pelo rótulo mesmo com acento (Ônibus)', () => {
    const { porCampo } = mapearErrosServidor(ROTA_CRIAR, ['Ônibus não encontrado']);
    expect(porCampo.get('onibusId')).toEqual(['Ônibus não encontrado']);
  });

  it('mantém como gerais as mensagens que não citam um campo', () => {
    const { porCampo, gerais } = mapearErrosServidor(PESSOA_CRIAR, [
      'Já existe uma pessoa com esse CPF',
      'property idade should not exist',
    ]);

    expect(porCampo.size).toBe(0);
    expect(gerais).toEqual([
      'Já existe uma pessoa com esse CPF',
      'O campo "idade" não é aceito pela API.',
    ]);
  });
});
