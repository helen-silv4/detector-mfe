import { Component, HostListener, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DroneService } from '../../core/drone';

const STREAM_BASE_URL = 'http://localhost:8000/deteccao/stream';

/** Teclas mapeadas para controle RC */
const TECLAS_VALIDAS = new Set(['w', 's', 'a', 'd', 'i', 'k', 'j', 'l']);

/** Trava de decolagem: exatamente 8 casas decimais após o ponto (mesma regex do backend) */
export const REGEX_COORDENADA_8_CASAS = /^-?\d+\.\d{8}$/;

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

  // ─── Estado do registro de infração ─────────────────────────────
  salvandoInfracao = false;
  infracaoSalva = false;

  // ─── Coordenadas de decolagem (trava de 8 casas decimais) ───────
  // Mantidas como string e persistidas no localStorage para sobreviver a F5
  private _decolagemLat = '';
  private _decolagemLon = '';

  get decolagemLat(): string {
    return this._decolagemLat;
  }
  set decolagemLat(val: string) {
    this._decolagemLat = val ?? '';
    localStorage.setItem('decolagemLat', this._decolagemLat);
  }

  get decolagemLon(): string {
    return this._decolagemLon;
  }
  set decolagemLon(val: string) {
    this._decolagemLon = val ?? '';
    localStorage.setItem('decolagemLon', this._decolagemLon);
  }

  decolando = false;
  erroDecolagem = '';

  get latDecolagemValida(): boolean {
    return REGEX_COORDENADA_8_CASAS.test(this.decolagemLat);
  }

  get lonDecolagemValida(): boolean {
    return REGEX_COORDENADA_8_CASAS.test(this.decolagemLon);
  }

  get coordenadasDecolagemValidas(): boolean {
    return this.latDecolagemValida && this.lonDecolagemValida;
  }

  ngOnInit() {
    // Recupera coordenadas salvas no localStorage no carregamento da página
    this._decolagemLat = localStorage.getItem('decolagemLat') || '';
    this._decolagemLon = localStorage.getItem('decolagemLon') || '';

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

  /** POST para iniciar missão (somente com coordenadas válidas) e, no sucesso, conectar o vídeo */
  decolarEInspecionar() {
    // Defesa extra além do [disabled] do botão
    if (!this.coordenadasDecolagemValidas || this.decolando) return;

    this.decolando = true;
    this.erroDecolagem = '';

    this.droneService.iniciarMissao(this.decolagemLat, this.decolagemLon).subscribe({
      next: (res) => {
        console.log('Missão iniciada com sucesso:', res);
        this.decolando = false;
        this.conectarVideo();
      },
      error: (err) => {
        console.error('Erro ao iniciar missão:', err);
        this.decolando = false;
        this.erroDecolagem =
          err?.status === 400 && typeof err.error?.detail === 'string'
            ? err.error.detail
            : 'Falha ao iniciar a missão. Verifique a conexão com a API.';
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

  // ─── Registro de infração ───────────────────────────────────────

  /** Dispara a captura da infração no backend (extrai imagem e telemetria da IA automaticamente) */
  capturarInfracao() {
    this.salvandoInfracao = true;
    this.infracaoSalva = false;

    this.droneService.registrarDeteccao(1).subscribe({
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