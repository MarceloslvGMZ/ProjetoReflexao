import type { ConfigRecurso, Registro } from './config-recurso';

export function filtrarLista(
  itens: readonly Registro[],
  busca: string,
  filtros: Readonly<Record<string, string>>,
  extras: unknown,
  config: ConfigRecurso,
): Registro[] {
  const termo = busca.trim().toLocaleLowerCase('pt-BR');
  return itens.filter((item) => correspondeBusca(item, termo, config) && correspondeFiltros(item, filtros, extras, config));
}

function correspondeBusca(item: Registro, termo: string, config: ConfigRecurso): boolean {
  if (!termo) return true;
  return config.buscarEm.some((campo) =>
    String(item[campo] ?? '').toLocaleLowerCase('pt-BR').includes(termo),
  );
}

function correspondeFiltros(
  item: Registro,
  filtros: Readonly<Record<string, string>>,
  extras: unknown,
  config: ConfigRecurso,
): boolean {
  return (config.filtros ?? []).every((filtro) => {
    const valor = filtros[filtro.id];
    if (!valor || (filtro.recarrega && !filtro.corresponde)) return true;
    if (filtro.corresponde) return filtro.corresponde(item, valor, extras);
    return String(item[filtro.id]) === valor;
  });
}
