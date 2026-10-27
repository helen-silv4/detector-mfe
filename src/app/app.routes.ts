import { Routes } from '@angular/router';
import { Deteccao } from './pages/deteccao/deteccao';
import { Testes } from './pages/testes/testes';
import { Dashboard } from './pages/dashboard/dashboard';

export const routes: Routes = [
  { path: '', redirectTo: 'deteccao', pathMatch: 'full' },
  { path: 'deteccao', component: Deteccao },
  { path: 'testes', component: Testes },
  { path: 'dashboard', component: Dashboard },
];