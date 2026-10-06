import { Component, HostListener, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DroneService } from '../../core/drone';

const STREAM_BASE_URL = 'http://localhost:8000/deteccao/stream';

/** Teclas mapeadas para controle RC */
const TECLAS_VALIDAS = new Set(['w', 's', 'a', 'd', 'i', 'k', 'j', 'l']);

@Component({
  selector: 'app-deteccao',
  imports: [FormsModule],
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

  // ─── Formulário de registro de infração ─────────────────────────
  infracaoLat = -23.5222;
  infracaoLon = -46.6736;
  infracaoConfianca = 0.85;
  salvandoInfracao = false;
  infracaoSalva = false;

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
    this.droneService.iniciarMissao().subscribe({
      next: (res) => {
        console.log('Missão iniciada com sucesso:', res);
        this.conectarVideo();
      },
      error: (err) => {
        console.error('Erro ao iniciar missão:', err);
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

  // ─── Registro manual de infração ─────────────────────────────────

  /** Captura os dados do formulário e registra a infração no backend */
  capturarInfracao() {
    this.salvandoInfracao = true;
    this.infracaoSalva = false;

    const dados = {
      lat: this.infracaoLat,
      lon: this.infracaoLon,
      confianca: this.infracaoConfianca,
      img_path: `capturas/drone_frame_${Date.now()}.jpg`
    };

    this.droneService.registrarDeteccao(1, dados).subscribe({
      next: (res) => {
        console.log('Infração registrada com sucesso:', res);
        this.salvandoInfracao = false;
        this.infracaoSalva = true;
        setTimeout(() => this.infracaoSalva = false, 3000);
      },
      error: (err) => {
        console.error('Erro ao registrar infração:', err);
        this.salvandoInfracao = false;
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