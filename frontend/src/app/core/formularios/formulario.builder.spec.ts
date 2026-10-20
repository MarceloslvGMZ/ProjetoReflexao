import {
  OCORRENCIA_CRIAR,
  PESSOA_ATUALIZAR,
  PESSOA_CRIAR,
  ROTA_CRIAR,
} from '../../../testing/descricoes';
import {
  aplicarCondicoes,
  montarFormulario,
  montarPayload,
  paraDataHoraLocal,
  resolverCaminho,
} from './formulario.builder';

describe('formulario.builder', () => {
  describe('montarFormulario', () => {
    it('cria um controle por campo, com obrigatoriedade vinda dos metadados', () => {
      const form = montarFormulario(PESSOA_CRIAR);

      expect(Object.keys(form.controls)).toEqual(['nome', 'cpf', 'tipo', 'matricula']);
      expect(form.controls['nome'].hasError('obrigatorio')).toBe(true);
      expect(form.controls['tipo'].value).toBeNull();
    });

    it('recusa texto obrigatório preenchido só com espaços', () => {
      const form = montarFormulario(PESSOA_CRIAR);
      form.controls['nome'].setValue('   ');
      expect(form.controls['nome'].hasError('obrigatorio')).toBe(true);
    });

    it('valida número inteiro', () => {
      const form = montarFormulario(OCORRENCIA_CRIAR);
      form.controls['quantidade'].setValue(2.5);
      expect(form.controls['quantidade'].hasError('inteiro')).toBe(true);
      form.controls['quantidade'].setValue(3);
      expect(form.controls['quantidade'].valid).toBe(true);
    });

    it('começa booleanos opcionais marcados, para não contrariar o padrão do backend', () => {
      expect(montarFormulario(ROTA_CRIAR).controls['ativo'].value).toBe(true);
    });

    it('preenche os valores de um registro em edição e desabilita os somente leitura', () => {
      const form = montarFormulario(PESSOA_ATUALIZAR, {
        valores: { id: 7, nome: 'Ana', cpf: '52998224725', tipo: 'ESTUDANTE', matricula: 'M1' },
        somenteLeitura: ['tipo'],
      });

      expect(form.getRawValue()).toEqual({
        nome: 'Ana',
        cpf: '52998224725',
        tipo: 'ESTUDANTE',
        matricula: 'M1',
      });
      expect(form.controls['tipo'].disabled).toBe(true);
      expect(form.controls['matricula'].enabled).toBe(true);
    });
  });

  describe('obrigatorioSe', () => {
    it('só habilita (e exige) a matrícula para estudantes', () => {
      const form = montarFormulario(PESSOA_CRIAR);
      const matricula = form.controls['matricula'];
      expect(matricula.disabled).toBe(true);

      form.controls['tipo'].setValue('ESTUDANTE');
      aplicarCondicoes(form, PESSOA_CRIAR);
      expect(matricula.enabled).toBe(true);
      expect(matricula.hasError('obrigatorio')).toBe(true);

      matricula.setValue('2024001');
      form.controls['tipo'].setValue('MOTORISTA');
      aplicarCondicoes(form, PESSOA_CRIAR);
      expect(matricula.disabled).toBe(true);
      expect(matricula.value).toBe('');
    });
  });

  describe('montarPayload', () => {
    it('omite campos condicionais que não se aplicam', () => {
      const form = montarFormulario(PESSOA_CRIAR);
      form.patchValue({ nome: 'João', cpf: '529.982.247-25', tipo: 'MOTORISTA' });
      aplicarCondicoes(form, PESSOA_CRIAR);

      expect(montarPayload(PESSOA_CRIAR, form)).toEqual({
        nome: 'João',
        cpf: '529.982.247-25',
        tipo: 'MOTORISTA',
      });
    });

    it('inclui campos somente leitura (o PUT envia o objeto completo)', () => {
      const form = montarFormulario(PESSOA_ATUALIZAR, {
        valores: { nome: 'Ana', cpf: '52998224725', tipo: 'ESTUDANTE', matricula: 'M1' },
        somenteLeitura: ['tipo'],
      });
      expect(montarPayload(PESSOA_ATUALIZAR, form)).toMatchObject({ tipo: 'ESTUDANTE' });
    });

    it('converte números, referências, booleanos e data-hora', () => {
      const rota = montarFormulario(ROTA_CRIAR);
      rota.patchValue({ nome: 'Centro', turno: 'MANHA', onibusId: '3', ativo: false });
      expect(montarPayload(ROTA_CRIAR, rota)).toEqual({
        nome: 'Centro',
        turno: 'MANHA',
        onibusId: 3,
        ativo: false,
      });

      const ocorrencia = montarFormulario(OCORRENCIA_CRIAR);
      ocorrencia.patchValue({ titulo: 'Pneu furado', dataHora: '2026-10-13T08:30', quantidade: '2' });
      expect(montarPayload(OCORRENCIA_CRIAR, ocorrencia)).toEqual({
        titulo: 'Pneu furado',
        dataHora: new Date('2026-10-13T08:30').toISOString(),
        quantidade: 2,
      });
    });

    it('omite opcionais vazios', () => {
      const form = montarFormulario(OCORRENCIA_CRIAR);
      form.patchValue({ titulo: 'Atraso', quantidade: 1 });
      expect(montarPayload(OCORRENCIA_CRIAR, form)).not.toHaveProperty('dataHora');
    });
  });

  it('resolve o :id do caminho', () => {
    expect(resolverCaminho('/onibus/:id', 4)).toBe('/onibus/4');
    expect(resolverCaminho('/onibus')).toBe('/onibus');
    expect(() => resolverCaminho('/onibus/:id')).toThrow();
  });

  it('converte ISO para o formato do datetime-local', () => {
    const iso = new Date(2026, 9, 13, 7, 5).toISOString();
    expect(paraDataHoraLocal(iso)).toBe('2026-10-13T07:05');
  });
});
