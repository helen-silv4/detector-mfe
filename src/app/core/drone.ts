import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

const API_URL = 'http://localhost:8000';

@Injectable({
  providedIn: 'root'
})
export class DroneService {
  private readonly http = inject(HttpClient);

  // ─── Métodos legados (usados pela página de testes) ─────────────

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

  // ─── Métodos novos (usados pela página de detecção) ─────────────

  /** POST /testes/voo-video — Inicia decolagem + câmera */
  iniciarMissao() {
    return this.http.post<{ status: string; logs: string[] }>(
      `${API_URL}/testes/voo-video`,
      {}
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
}

// Alias para compatibilidade com imports existentes (testes.ts, drone.spec.ts)
export { DroneService as Drone };