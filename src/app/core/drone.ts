import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_URL = 'http://localhost:8000';

/** Canais de log da tela de testes (mesmos nomes do backend) */
export type CanalTeste = 'voo' | 'video' | 'voo-video';

/** Evento recebido em tempo real pelo SSE GET /testes/logs/stream */
export interface EventoTeste {
  id: number;
  canal: CanalTeste;
  /** log = linha de log | fim = teste de voo terminou | video = mudança de estado do stream */
  tipo: 'log' | 'fim' | 'video';
  msg: string;
  ts: number;
  /** fim: 'sucesso' | 'erro' — video: 'ativo' | 'erro' | 'encerrado' */
  status?: string;
}

/** Notificação de estado da conexão SSE (para exibir aviso na tela) */
export type EstadoConexaoLogs = 'conectado' | 'reconectando';

@Injectable({
  providedIn: 'root'
})
export class DroneService {
  private readonly http = inject(HttpClient);

  // ─── Página de testes ───────────────────────────────────────────
  // Os POSTs apenas DISPARAM o teste no backend e retornam na hora
  // (status 'iniciado', ou 409 'ocupado'). Os logs chegam em tempo real
  // por streamLogsTestes().

  testeVoo() {
    return this.http.post<{ status: string; logs: string[] }>(
      `${API_URL}/testes/voo`,
      {}
    );
  }

  testeVideo() {
    return this.http.post<{ status: string; logs: string[] }>(
      `${API_URL}/testes/video`,
      {}
    );
  }

  testeVooVideo() {
    return this.http.post<{ status: string; logs: string[] }>(
      `${API_URL}/testes/voo-video`,
      {}
    );
  }

  /** URL do stream MJPEG da tela de testes (SEM YOLO), com timestamp anti-cache */
  urlVideoTeste(canal: CanalTeste) {
    return `${API_URL}/testes/video/stream?canal=${canal}&t=${Date.now()}`;
  }

  /**
   * Logs dos testes em tempo real via Server-Sent Events.
   * O EventSource reconecta sozinho se a API cair; `onEstado` avisa a tela.
   */
  streamLogsTestes(onEstado?: (estado: EstadoConexaoLogs) => void): Observable<EventoTeste> {
    return new Observable<EventoTeste>((observer) => {
      if (typeof EventSource === 'undefined') {
        observer.complete();
        return;
      }

      const fonte = new EventSource(`${API_URL}/testes/logs/stream`);
      fonte.onopen = () => onEstado?.('conectado');
      fonte.onerror = () => onEstado?.('reconectando');
      fonte.onmessage = (mensagem: MessageEvent<string>) => {
        try {
          observer.next(JSON.parse(mensagem.data) as EventoTeste);
        } catch {
          // Mensagem malformada: ignora e segue escutando
        }
      };

      return () => fonte.close();
    });
  }

  // ─── Métodos novos (usados pela página de detecção) ─────────────

  /**
   * POST /missao/decolar — Inicia decolagem + câmera.
   * As coordenadas são enviadas como string para preservar os zeros à direita
   * (o backend exige exatamente 8 casas decimais e responde 400 caso contrário).
   */
  iniciarMissao(latitude: string, longitude: string) {
    return this.http.post<{ status: string; logs: string[] }>(
      `${API_URL}/missao/decolar`,
      { latitude, longitude }
    );
  }

  /** POST /emergencia — Pouso de emergência (rota preparada para o futuro) */
  pousoEmergencia() {
    return this.http.post<{ status: string }>(
      `${API_URL}/emergencia`,
      {}
    );
  }

  /** POST /controle — Envia comando RC (lr, fb, ud, yv) para o drone */
  enviarControleRC(lr: number, fb: number, ud: number, yv: number) {
    return this.http.post<{ status: string }>(
      `${API_URL}/controle`,
      { lr, fb, ud, yv }
    );
  }

  // ─── Registro de infrações ambientais ─────────────────────────────

  /** POST /deteccao/registrar/{id_voo} — Registra uma detecção de infração com dados automáticos do backend */
  registrarDeteccao(id_voo: number = 1) {
    return this.http.post<{ status: string; id_deteccao?: number }>(
      `${API_URL}/deteccao/registrar/${id_voo}`,
      {}
    );
  }
}

// Alias para compatibilidade com imports existentes (testes.ts, drone.spec.ts)
export { DroneService as Drone };