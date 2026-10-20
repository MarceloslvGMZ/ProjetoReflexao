/** Rótulos dos valores de `opcoes` (a API envia apenas os valores, ex.: `ESTUDANTE`). */
const ROTULOS: Record<string, string> = {
  MOTORISTA: 'Motorista',
  ESTUDANTE: 'Estudante',
  ADMINISTRADOR: 'Administrador',
  MANHA: 'Manhã',
  TARDE: 'Tarde',
  NOITE: 'Noite',
};

/** Valores sem rótulo cadastrado viram texto legível: `EM_ANALISE` → `Em analise`. */
export function rotuloOpcao(valor: string): string {
  const rotulo = ROTULOS[valor];
  if (rotulo) return rotulo;
  const texto = valor.replace(/_/g, ' ').toLowerCase();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
