import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

const API_URL = 'http://localhost:8000';

/** Interface alinhada com as colunas exatas do PostgreSQL */
export interface Deteccao {
  id_deteccao: number;
  id_voo: number;
  latitude: number;
  longitude: number;
  confianca_ia: number;
  caminho_imagem: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  private readonly http = inject(HttpClient);

  registros: Deteccao[] = [];
  carregando = false;
  erro = false;

  ngOnInit() {
    this.carregarRegistros();
  }

  /** Busca os registros de detecção salvos no backend */
  carregarRegistros() {
    this.carregando = true;
    this.erro = false;

    this.http.get<Deteccao[]>(`${API_URL}/deteccao/listar`).subscribe({
      next: (res) => {
        console.log('Dados do Banco:', res);
        this.registros = res;
        this.carregando = false;
      },
      error: (err) => {
        console.error('Erro ao carregar registros:', err);
        this.carregando = false;
        this.erro = true;
      }
    });
  }

  /** Força o recarregamento dos dados do dashboard */
  atualizarDashboard() {
    this.carregarRegistros();
  }
}
