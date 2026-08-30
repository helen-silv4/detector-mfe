import { Component, inject, signal } from '@angular/core';
import { Drone } from '../../core/drone';
import { TelemetryPanel } from '../../shared/telemetry-panel/telemetry-panel';
import { RoutineCard } from '../../shared/routine-card/routine-card';

@Component({
  selector: 'app-testes',
  imports: [TelemetryPanel, RoutineCard],
  templateUrl: './testes.html',
  styleUrl: './testes.scss',
})
export class Testes {
  private drone = inject(Drone);

  logsVoo = signal<string[]>([]);
  logsVideo = signal<string[]>([]);
  logsVooVideo = signal<string[]>([]);

  carregandoVoo = signal(false);
  carregandoVideo = signal(false);
  carregandoVooVideo = signal(false);

  executarTesteVoo() {
    this.carregandoVoo.set(true);
    this.drone.testeVoo().subscribe((resposta) => {
      this.logsVoo.set(resposta.logs);
      this.carregandoVoo.set(false);
    });
  }

  executarTesteVideo() {
    this.carregandoVideo.set(true);
    this.drone.testeVideo().subscribe((resposta) => {
      this.logsVideo.set(resposta.logs);
      this.carregandoVideo.set(false);
    });
  }

  executarTesteVooVideo() {
    this.carregandoVooVideo.set(true);
    this.drone.testeVooVideo().subscribe((resposta) => {
      this.logsVooVideo.set(resposta.logs);
      this.carregandoVooVideo.set(false);
    });
  }
}
