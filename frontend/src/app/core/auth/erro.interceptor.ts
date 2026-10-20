import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * 401 com sessão aberta significa token inválido ou expirado: encerra a sessão e volta ao login.
 * O 401 do próprio `POST /auth/login` (usuário ou senha inválidos) é tratado pela tela de login.
 */
export const erroInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((erro: unknown) => {
      const sessaoExpirada =
        erro instanceof HttpErrorResponse &&
        erro.status === 401 &&
        auth.token() !== null &&
        !req.url.endsWith('/auth/login');
      if (sessaoExpirada) auth.encerrarSessaoExpirada(router.url);
      return throwError(() => erro);
    }),
  );
};
