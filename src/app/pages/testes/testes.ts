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
    this.drone.testeVoo().subscribe(resposta => {
      this.logsVoo.set(resposta.logs);
      this.carregandoVoo.set(false);
    });
  }

  executarTesteVideo() {
    this.carregandoVideo.set(true);
    this.drone.testeVideo().subscribe(resposta => {
      this.logsVideo.set(resposta.logs);
      this.carregandoVideo.set(false);
    });
  }

  executarTesteVooVideo() {
    this.carregandoVooVideo.set(true);
    this.drone.testeVooVideo().subscribe(resposta => {
      this.logsVooVideo.set(resposta.logs);
      this.carregandoVooVideo.set(false);
    });
  }
}