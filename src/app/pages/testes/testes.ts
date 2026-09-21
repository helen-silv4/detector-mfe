import { Component, signal } from '@angular/core';
import { Drone } from '../../core/drone';

@Component({
  selector: 'app-testes',
  imports: [],
  templateUrl: './testes.html',
  styleUrl: './testes.scss'
})
export class Testes {
  logsVoo = signal<string[]>([]);
  logsVideo = signal<string[]>([]);
  logsVooVideo = signal<string[]>([]);

  carregandoVoo = signal(false);
  carregandoVideo = signal(false);
  carregandoVooVideo = signal(false);

  constructor(private drone: Drone) {}

  executarTesteVoo() {
    this.carregandoVoo.set(true);
    this.logsVoo.set([]);
    this.drone
      .executarTesteStream('/testes/voo', (log) => {
        this.logsVoo.update(logs => [...logs, log]);
      })
      .finally(() => this.carregandoVoo.set(false));
  }

  executarTesteVideo() {
    this.carregandoVideo.set(true);
    this.logsVideo.set([]);
    this.drone
      .executarTesteStream('/testes/video', (log) => {
        this.logsVideo.update(logs => [...logs, log]);
      })
      .finally(() => this.carregandoVideo.set(false));
  }

  executarTesteVooVideo() {
    this.carregandoVooVideo.set(true);
    this.logsVooVideo.set([]);
    this.drone
      .executarTesteStream('/testes/voo-video', (log) => {
        this.logsVooVideo.update(logs => [...logs, log]);
      })
      .finally(() => this.carregandoVooVideo.set(false));
  }
}