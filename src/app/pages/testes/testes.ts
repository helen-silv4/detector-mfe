import { Component, OnDestroy, signal } from '@angular/core';
import { Drone } from '../../core/drone';

const STREAM_BASE_URL = 'http://localhost:8000/deteccao/stream';

@Component({
  selector: 'app-testes',
  imports: [],
  templateUrl: './testes.html',
  styleUrl: './testes.scss'
})
export class Testes implements OnDestroy {
  logsVoo = signal<string[]>([]);
  logsVideo = signal<string[]>([]);
  logsVooVideo = signal<string[]>([]);

  carregandoVoo = signal(false);
  carregandoVideo = signal(false);
  carregandoVooVideo = signal(false);

  // ─── Monitor de vídeo ───────────────────────────────────────────
  streamUrl = STREAM_BASE_URL;
  exibirVideo = false;
  streamError = false;

  private reconexaoTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private drone: Drone) {}

  ngOnDestroy() {
    this.limparReconexao();
  }

  // ─── Testes ─────────────────────────────────────────────────────

  executarTesteVoo() {
    this.carregandoVoo.set(true);
    this.drone.testeVoo().subscribe({
      next: resposta => {
        this.logsVoo.set(resposta.logs);
        this.carregandoVoo.set(false);
      },
      error: () => {
        this.logsVoo.set(['Erro ao executar teste de voo. Verifique a conexão com a API.']);
        this.carregandoVoo.set(false);
      }
    });
  }

  executarTesteVideo() {
    this.carregandoVideo.set(true);
    this.iniciarVideo();
    this.drone.testeVideo().subscribe({
      next: resposta => {
        this.logsVideo.set(resposta.logs);
        this.carregandoVideo.set(false);
      },
      error: () => {
        this.logsVideo.set(['Erro ao executar teste de vídeo. Verifique a conexão com a API.']);
        this.carregandoVideo.set(false);
      }
    });
  }

  executarTesteVooVideo() {
    this.carregandoVooVideo.set(true);
    this.iniciarVideo();
    this.drone.testeVooVideo().subscribe({
      next: resposta => {
        this.logsVooVideo.set(resposta.logs);
        this.carregandoVooVideo.set(false);
      },
      error: () => {
        this.logsVooVideo.set(['Erro ao executar teste de voo + vídeo. Verifique a conexão com a API.']);
        this.carregandoVooVideo.set(false);
      }
    });
  }

  /** POST para pouso de emergência */
  pousoEmergencia() {
    this.drone.pousoEmergencia().subscribe({
      next: res => console.warn('Pouso de emergência executado:', res),
      error: err => console.error('Erro no pouso de emergência:', err)
    });
  }

  // ─── Stream de vídeo ────────────────────────────────────────────

  /** Exibe o monitor e conecta ao stream (timestamp evita cache) */
  private iniciarVideo() {
    this.limparReconexao();
    this.exibirVideo = true;
    this.streamError = false;
    this.streamUrl = `${STREAM_BASE_URL}?ia=false&t=${Date.now()}`;
  }

  /** Oculta o monitor. Não há endpoint de desligamento do stream no backend. */
  pararVideo() {
    this.limparReconexao();
    this.exibirVideo = false;
    this.streamError = false;
  }

  /** Marca falha no sinal e tenta reconectar em 3 s enquanto o monitor estiver ativo */
  onStreamError() {
    this.streamError = true;
    this.limparReconexao();
    this.reconexaoTimer = setTimeout(() => {
      if (this.exibirVideo) {
        this.streamError = false;
        this.streamUrl = `${STREAM_BASE_URL}?ia=false&t=${Date.now()}`;
      }
    }, 3000);
  }

  private limparReconexao() {
    if (this.reconexaoTimer) {
      clearTimeout(this.reconexaoTimer);
      this.reconexaoTimer = null;
    }
  }
}