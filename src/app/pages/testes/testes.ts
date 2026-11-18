import {
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  afterRenderEffect,
  WritableSignal,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Observable } from 'rxjs';
import { CanalTeste, DroneService, EventoTeste } from '../../core/drone';

/** Tentativas automáticas de reconexão do vídeo antes de desistir */
const MAX_TENTATIVAS_VIDEO = 3;
const ATRASO_RECONEXAO_MS = 3000;
/** Segurança: libera o botão se o backend nunca confirmar o vídeo */
const TIMEOUT_VIDEO_MS = 25000;

@Component({
  selector: 'app-testes',
  imports: [],
  templateUrl: './testes.html',
  styleUrl: './testes.scss'
})
export class Testes implements OnInit {
  private readonly drone = inject(DroneService);
  private readonly destroyRef = inject(DestroyRef);

  // ─── Logs (atualizados em tempo real via SSE) ───────────────────
  logsVoo = signal<string[]>([]);
  logsVideo = signal<string[]>([]);
  logsVooVideo = signal<string[]>([]);

  carregandoVoo = signal(false);
  carregandoVideo = signal(false);
  carregandoVooVideo = signal(false);

  /** Aviso quando a conexão de logs em tempo real com a API cai */
  logsDesconectados = signal(false);

  // ─── Monitor de vídeo (sem YOLO) ────────────────────────────────
  // Signals: o app é zoneless, então campos comuns alterados por timers/SSE
  // não atualizariam a tela.
  streamUrl = signal('');
  exibirVideo = signal(false);
  streamError = signal(false);

  /** Canal que recebe os logs do vídeo atual ('video' ou 'voo-video') */
  private canalVideo: CanalTeste = 'video';
  private tentativasVideo = 0;
  private reconexaoTimer: ReturnType<typeof setTimeout> | null = null;
  private timeoutVideoTimer: ReturnType<typeof setTimeout> | null = null;

  // ─── Auto-scroll dos painéis de log ─────────────────────────────
  private readonly painelVoo = viewChild<ElementRef<HTMLElement>>('painelVoo');
  private readonly painelVideo = viewChild<ElementRef<HTMLElement>>('painelVideo');
  private readonly painelVooVideo = viewChild<ElementRef<HTMLElement>>('painelVooVideo');

  constructor() {
    afterRenderEffect(() => {
      this.logsVoo();
      this.logsVideo();
      this.logsVooVideo();
      for (const painel of [this.painelVoo(), this.painelVideo(), this.painelVooVideo()]) {
        const el = painel?.nativeElement;
        if (el) el.scrollTop = el.scrollHeight;
      }
    });

    this.destroyRef.onDestroy(() => {
      this.limparReconexao();
      this.limparTimeoutVideo();
    });
  }

  ngOnInit() {
    const assinatura = this.drone
      .streamLogsTestes((estado) => this.logsDesconectados.set(estado === 'reconectando'))
      .subscribe((evento) => this.processarEvento(evento));

    this.destroyRef.onDestroy(() => assinatura.unsubscribe());
  }

  // ─── Eventos em tempo real ──────────────────────────────────────

  private processarEvento(evento: EventoTeste) {
    if (evento.tipo === 'log' && evento.msg) {
      this.adicionarLog(evento.canal, evento.msg, evento.ts);
      return;
    }

    if (evento.tipo === 'fim') {
      // Fim de um teste de voo ('voo' ou 'voo-video')
      this.adicionarLog(
        evento.canal,
        evento.status === 'sucesso' ? '[SYS] ✔ Teste concluído com sucesso.' : '[SYS] ✖ Teste finalizado com erro.',
        evento.ts
      );
      if (evento.canal === 'voo') this.carregandoVoo.set(false);
      if (evento.canal === 'voo-video') this.carregandoVooVideo.set(false);
      return;
    }

    if (evento.tipo === 'video') {
      if (evento.status === 'ativo') {
        this.tentativasVideo = 0;
        this.streamError.set(false);
        this.limparTimeoutVideo();
        this.carregandoVideo.set(false);
      } else if (evento.status === 'erro') {
        this.limparTimeoutVideo();
        this.carregandoVideo.set(false);
      }
    }
  }

  private adicionarLog(canal: CanalTeste, msg: string, ts = Date.now() / 1000) {
    const hora = new Date(ts * 1000).toLocaleTimeString('pt-BR', { hour12: false });
    const linha = `${hora}  ${msg}`;
    this.sinalDoCanal(canal).update((logs) => [...logs, linha]);
  }

  private sinalDoCanal(canal: CanalTeste) {
    switch (canal) {
      case 'voo': return this.logsVoo;
      case 'voo-video': return this.logsVooVideo;
      default: return this.logsVideo;
    }
  }

  /** Cor da linha de log conforme o prefixo */
  classeLog(linha: string): string {
    if (linha.includes('[ERRO]') || linha.includes('✖')) return 'text-red-400';
    if (linha.includes('[VID]')) return 'text-sky-400';
    if (linha.includes('[TEL]')) return 'text-gray-400';
    if (linha.includes('✔')) return 'text-[#10B981] font-bold';
    return 'text-[#10B981]';
  }

  // ─── Vídeo ──────────────────────────────────────────────────────

  private iniciarVideo(canal: CanalTeste) {
    this.limparReconexao();
    this.canalVideo = canal;
    this.tentativasVideo = 0;
    this.streamError.set(false);
    this.streamUrl.set(this.drone.urlVideoTeste(canal));
    this.exibirVideo.set(true);
  }

  onStreamError() {
    if (!this.exibirVideo()) return;
    this.streamError.set(true);

    if (this.tentativasVideo >= MAX_TENTATIVAS_VIDEO) {
      this.adicionarLog(this.canalVideo, '[VID] Não foi possível obter o vídeo. Verifique a conexão com o drone.');
      this.exibirVideo.set(false);
      this.carregandoVideo.set(false);
      this.limparTimeoutVideo();
      return;
    }

    this.tentativasVideo++;
    this.adicionarLog(
      this.canalVideo,
      `[VID] Sinal de vídeo perdido. Reconectando em ${ATRASO_RECONEXAO_MS / 1000}s ` +
        `(tentativa ${this.tentativasVideo}/${MAX_TENTATIVAS_VIDEO})...`
    );

    this.limparReconexao();
    this.reconexaoTimer = setTimeout(() => {
      this.reconexaoTimer = null;
      if (!this.exibirVideo()) return;
      this.streamError.set(false);
      this.streamUrl.set(this.drone.urlVideoTeste(this.canalVideo));
    }, ATRASO_RECONEXAO_MS);
  }

  pararVideo() {
    if (!this.exibirVideo()) return;
    this.limparReconexao();
    this.limparTimeoutVideo();
    // Remover o <img> fecha a conexão HTTP; o backend encerra o stream (streamoff) sozinho
    this.exibirVideo.set(false);
    this.streamError.set(false);
    this.streamUrl.set('');
    this.carregandoVideo.set(false);
    this.adicionarLog(this.canalVideo, '[VID] Vídeo parado pelo usuário.');
  }

  pousoEmergencia() {
    this.adicionarLog('voo', '[SYS] Pouso de emergência solicitado...');
    this.drone.pousoEmergencia().subscribe({
      next: (resposta) => {
        const logs = (resposta as { logs?: string[] }).logs ?? [];
        logs.forEach((log) => this.adicionarLog('voo', log));
      },
      error: () => this.adicionarLog('voo', '[ERRO] Falha ao enviar o pouso de emergência para a API.'),
    });
  }

  limparReconexao() {
    if (this.reconexaoTimer) {
      clearTimeout(this.reconexaoTimer);
      this.reconexaoTimer = null;
    }
  }

  private limparTimeoutVideo() {
    if (this.timeoutVideoTimer) {
      clearTimeout(this.timeoutVideoTimer);
      this.timeoutVideoTimer = null;
    }
  }

  // ─── Testes ─────────────────────────────────────────────────────

  executarTesteVoo() {
    if (this.carregandoVoo() || this.carregandoVooVideo()) return;
    this.carregandoVoo.set(true);
    this.logsVoo.set([]);
    this.adicionarLog('voo', '[SYS] Solicitando teste de voo...');
    this.dispararTeste('voo', this.drone.testeVoo(), this.carregandoVoo);
  }

  executarTesteVideo() {
    if (this.carregandoVideo()) return;
    this.carregandoVideo.set(true);
    this.logsVideo.set([]);
    this.adicionarLog('video', '[VID] Abrindo stream de vídeo (sem IA)...');
    this.iniciarVideo('video');

    this.limparTimeoutVideo();
    this.timeoutVideoTimer = setTimeout(() => {
      this.timeoutVideoTimer = null;
      if (this.carregandoVideo()) {
        this.carregandoVideo.set(false);
        this.adicionarLog('video', '[VID] Tempo esgotado aguardando confirmação do vídeo.');
      }
    }, TIMEOUT_VIDEO_MS);
  }

  executarTesteVooVideo() {
    if (this.carregandoVoo() || this.carregandoVooVideo()) return;
    this.carregandoVooVideo.set(true);
    this.logsVooVideo.set([]);
    this.adicionarLog('voo-video', '[SYS] Abrindo vídeo e solicitando teste de voo...');
    // O backend aguarda o vídeo ficar ativo antes de decolar
    this.iniciarVideo('voo-video');
    this.dispararTeste('voo-video', this.drone.testeVooVideo(), this.carregandoVooVideo);
  }

  /** Dispara o teste; os logs e o fim chegam pelo SSE */
  private dispararTeste(
    canal: CanalTeste,
    requisicao: Observable<{ status: string; logs: string[] }>,
    carregando: WritableSignal<boolean>
  ) {
    requisicao.subscribe({
      next: (resposta) => {
        if (resposta.status !== 'iniciado') {
          (resposta.logs ?? []).forEach((log) => this.adicionarLog(canal, log));
          carregando.set(false);
        }
      },
      error: (err) => {
        const logs: string[] = err?.error?.logs ?? [];
        if (logs.length) {
          logs.forEach((log) => this.adicionarLog(canal, log));
        } else {
          this.adicionarLog(canal, '[ERRO] Não foi possível falar com a API (http://localhost:8000).');
        }
        carregando.set(false);
      },
    });
  }
}
