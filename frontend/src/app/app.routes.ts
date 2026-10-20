import { Routes } from '@angular/router';
import { autenticadoGuard, perfilGuard, visitanteGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [visitanteGuard],
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: '',
    canActivate: [autenticadoGuard],
    loadComponent: () => import('./core/layout/admin-layout/admin-layout').then((m) => m.AdminLayout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        data: { titulo: 'Visão geral' },
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'onibus',
        data: { titulo: 'Ônibus' },
        loadComponent: () => import('./features/onibus/onibus').then((m) => m.OnibusPage),
      },
      {
        path: 'pessoas',
        data: { titulo: 'Pessoas' },
        loadComponent: () => import('./features/pessoas/pessoas').then((m) => m.PessoasPage),
      },
      {
        path: 'rotas',
        data: { titulo: 'Rotas' },
        loadComponent: () => import('./features/rotas/rotas').then((m) => m.RotasPage),
      },
      {
        path: 'ocorrencias',
        data: { titulo: 'Ocorrências' },
        loadComponent: () => import('./features/ocorrencias/ocorrencias').then((m) => m.OcorrenciasPage),
      },
      {
        path: 'usuarios',
        data: { titulo: 'Usuários' },
        canActivate: [perfilGuard('ADMINISTRADOR')],
        loadComponent: () => import('./features/usuarios/usuarios').then((m) => m.UsuariosPage),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
