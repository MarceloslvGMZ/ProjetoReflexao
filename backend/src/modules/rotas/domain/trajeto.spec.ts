import { distanciaMetros, duracaoDeOnibus, trajetoEmLinhaReta } from './trajeto.js';

const anapolis = { nome: 'Anápolis', latitude: -16.328, longitude: -48.953 };
const goiania = { nome: 'Goiânia', latitude: -16.686, longitude: -49.265 };

describe('trajeto', () => {
  it('mede a distância direta entre duas cidades', () => {
    const metros = distanciaMetros(anapolis, goiania);
    expect(metros).toBeGreaterThan(50_000);
    expect(metros).toBeLessThan(70_000);
  });

  it('estima a linha reta na velocidade de um ônibus', () => {
    const trajeto = trajetoEmLinhaReta(anapolis, goiania);
    expect(trajeto.fonte).toBe('reta');
    expect(trajeto.linha).toHaveLength(2);
    expect(trajeto.duracaoSegundos).toBeGreaterThan(60 * 60);
  });

  it('fica mais longo quando há uma parada no meio', () => {
    const direto = trajetoEmLinhaReta(anapolis, goiania);
    const comParada = trajetoEmLinhaReta(anapolis, goiania, [
      { nome: 'UEG', latitude: -16.4, longitude: -48.7 },
    ]);
    expect(comParada.linha).toHaveLength(3);
    expect(comParada.distanciaMetros).toBeGreaterThan(direto.distanciaMetros);
  });

  it('deixa o ônibus mais lento que o carro', () => {
    expect(duracaoDeOnibus(1000)).toBe(1250);
    expect(duracaoDeOnibus(10)).toBe(60);
  });
});
