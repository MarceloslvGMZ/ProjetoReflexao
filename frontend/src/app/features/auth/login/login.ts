import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideBus } from '@lucide/angular';
import { paraErroApi } from '../../../core/api/erro-api';
import { AuthService } from '../../../core/auth/auth.service';
import { FormularioDinamico } from '../../../shared/components/formulario-dinamico/formulario-dinamico';

@Component({
  selector: 'app-login',
  imports: [FormularioDinamico, LucideBus],
  templateUrl: './login.html',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly rota = inject(ActivatedRoute);
  protected readonly erro = signal<string | null>(null);

  protected async entrar(resposta: unknown): Promise<void> {
    const token = accessTokenDe(resposta);
    if (!token) {
      this.erro.set('A API não devolveu um token de acesso.');
      return;
    }
    try {
      await this.auth.iniciarSessao(token);
      await this.router.navigateByUrl(destinoAposLogin(this.rota.snapshot.queryParamMap.get('retorno')));
    } catch (erro) {
      this.erro.set(paraErroApi(erro).mensagens.join(' '));
    }
  }
}

export function destinoAposLogin(retorno: string | null): string {
  if (retorno && retorno.startsWith('/') && !retorno.startsWith('//') && !retorno.startsWith('/login')) {
    return retorno;
  }
  return '/dashboard';
}

function accessTokenDe(resposta: unknown): string | null {
  if (!resposta || typeof resposta !== 'object' || !('accessToken' in resposta)) return null;
  const token = resposta.accessToken;
  return typeof token === 'string' && token ? token : null;
}
