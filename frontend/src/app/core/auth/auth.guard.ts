import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import type { Perfil } from '../models';
import { AuthService } from './auth.service';

export const autenticadoGuard: CanActivateFn = (_rota, estado) => {
  if (inject(AuthService).autenticado()) return true;
  return inject(Router).createUrlTree(['/login'], { queryParams: { retorno: estado.url } });
};

/** Impede que um usuário já logado volte para a tela de login. */
export const visitanteGuard: CanActivateFn = () => {
  if (!inject(AuthService).autenticado()) return true;
  return inject(Router).createUrlTree(['/dashboard']);
};

export function perfilGuard(...perfis: Perfil[]): CanActivateFn {
  return () => {
    if (inject(AuthService).possuiPerfil(perfis)) return true;
    return inject(Router).createUrlTree(['/dashboard']);
  };
}
