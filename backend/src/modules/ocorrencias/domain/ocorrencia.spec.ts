import { DomainError } from '../../../shared/domain/errors.js';
import { Ocorrencia } from './ocorrencia.js';

const agora = new Date('2026-10-12T12:00:00Z');
const dados = {
  titulo: ' Pneu furado ',
  descricao: ' Ônibus parou na BR ',
  dataHora: new Date('2026-10-12T07:15:00Z'),
  usuarioId: 1,
  onibusId: 1,
  rotaId: 1,
};

describe('Ocorrencia', () => {
  it('cria uma ocorrência removendo espaços das pontas', () => {
    const ocorrencia = Ocorrencia.criar(dados, agora);

    expect(ocorrencia).toMatchObject({ id: null, titulo: 'Pneu furado', descricao: 'Ônibus parou na BR' });
  });

  it('exige título e descrição', () => {
    expect(() => Ocorrencia.criar({ ...dados, titulo: '  ' }, agora)).toThrow(DomainError);
    expect(() => Ocorrencia.criar({ ...dados, descricao: '' }, agora)).toThrow(DomainError);
  });

  it('limita o título a 100 caracteres', () => {
    expect(() => Ocorrencia.criar({ ...dados, titulo: 'a'.repeat(101) }, agora)).toThrow(DomainError);
  });

  it('rejeita data inválida ou no futuro', () => {
    expect(() => Ocorrencia.criar({ ...dados, dataHora: new Date('x') }, agora)).toThrow(DomainError);
    expect(() =>
      Ocorrencia.criar({ ...dados, dataHora: new Date('2026-10-12T12:00:01Z') }, agora),
    ).toThrow('A ocorrência não pode estar no futuro');
  });

  it('atualiza sem mudar o autor', () => {
    const ocorrencia = Ocorrencia.restaurar(1, dados);

    ocorrencia.atualizar({ ...dados, titulo: 'Atraso', rotaId: 2 }, agora);

    expect(ocorrencia).toMatchObject({ titulo: 'Atraso', rotaId: 2, usuarioId: 1 });
  });
});
