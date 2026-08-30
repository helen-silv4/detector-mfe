import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { Telemetry } from './core/telemetry';
import { Icon } from './shared/icon/icon';

interface Tab {
  path: string;
  label: string;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  telemetryService = inject(Telemetry);

  tabs: Tab[] = [
    { path: '/deteccao', label: 'Detecção' },
    { path: '/testes', label: 'Testes' },
  ];
}
