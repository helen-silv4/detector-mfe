import { Component, HostListener, inject, OnInit } from '@angular/core';
import { DroneService } from '../../core/drone';

const STREAM_BASE_URL = 'http://localhost:8000/deteccao/stream';

/** Teclas mapeadas para controle RC */
const TECLAS_VALIDAS = new Set(['w', 's', 'a', 'd', 'i', 'k', 'j', 'l']);

@Component({
  selector: 'app-deteccao',
  imports: [],
  templateUrl: './deteccao.html',
  styleUrl: './deteccao.scss'
})
export class Deteccao implements OnInit {
  private readonly droneService = inject(DroneService);

  streamUrl: string = STREAM_BASE_URL;
  streamError: boolean = true;

  // ─── Controle manual via teclado ────────────────────────────────
  velocidade = 50;
  controles = { lr: 0, fb: 0, ud: 0, yv: 0 };

  ngOnInit() {
    this.conectarVideo();
  }

  // ─── Stream de vídeo ────────────────────────────────────────────

  /** Atualiza a URL do stream com timestamp para evitar cache */
  conectarVideo() {
    this.streamError = false;
    this.streamUrl = `${STREAM_BASE_URL}?t=${Date.now()}`;
  }

  /** Reconexão automática após 3 s quando o stream falha */
  onStreamError() {
    this.streamError = true;
    console.warn('Sinal de vídeo perdido. Tentando reconectar em 3 segundos...');

    setTimeout(() => {
      this.conectarVideo();
    }, 3000);
  }

  // ─── Comandos de missão ─────────────────────────────────────────

  /** POST para iniciar missão e, no sucesso, conectar o vídeo */
  decolarEInspecionar() {
    this.droneService.executarTesteStream('/testes/voo-video', (log, status) => {
      console.log(log);
      if (status === 'sucesso') {
        this.conectarVideo();
      }
    });
  }

  /** POST para pouso de emergência */
  pousoEmergencia() {
    this.droneService.pousoEmergencia().subscribe({
      next: (res) => {
        console.warn('Pouso de emergência executado:', res);
      },
      error: (err) => {
        console.error('Erro no pouso de emergência:', err);
      }
    });
  }

  // ─── Controle RC via teclado ────────────────────────────────────

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    const tecla = event.key.toLowerCase();
    if (!TECLAS_VALIDAS.has(tecla)) return;

    event.preventDefault();
    this.atualizarEixo(tecla, true);
    this.enviarControle();
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent) {
    const tecla = event.key.toLowerCase();
    if (!TECLAS_VALIDAS.has(tecla)) return;

    event.preventDefault();
    this.atualizarEixo(tecla, false);
    this.enviarControle();
  }

  /**
   * Mapeia a tecla ao eixo correto do RC control.
   * - W/S → fb (frente / trás)
   * - A/D → lr (esquerda / direita)
   * - I/K → ud (subir / descer)
   * - J/L → yv (girar esquerda / girar direita)
   */
  private atualizarEixo(tecla: string, pressionada: boolean) {
    const v = pressionada ? this.velocidade : 0;

    switch (tecla) {
      case 'w': this.controles.fb =  v; break;   // frente
      case 's': this.controles.fb = -v; break;    // trás
      case 'a': this.controles.lr = -v; break;    // esquerda
      case 'd': this.controles.lr =  v; break;    // direita
      case 'i': this.controles.ud =  v; break;    // subir
      case 'k': this.controles.ud = -v; break;    // descer
      case 'j': this.controles.yv = -v; break;    // girar esquerda
      case 'l': this.controles.yv =  v; break;    // girar direita
    }
  }

  private enviarControle() {
    const { lr, fb, ud, yv } = this.controles;
    this.droneService.enviarControleRC(lr, fb, ud, yv).subscribe({
      error: (err) => console.error('Erro ao enviar controle RC:', err)
    });
  }
}

// Exporta também DeteccaoComponent para compatibilidade
export { Deteccao as DeteccaoComponent };