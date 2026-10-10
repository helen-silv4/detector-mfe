import { Component, OnInit, AfterViewInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, PercentPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import * as L from 'leaflet';

const API_URL = 'http://localhost:8000';

/**
 * Fix padrão Angular + Leaflet: o bundler quebra a detecção automática do caminho
 * dos ícones (marker-icon.png / marker-shadow.png), gerando 404. Apontamos para a CDN
 * oficial da mesma versão, sem precisar alterar o angular.json.
 */
L.Icon.Default.imagePath = 'https://unpkg.com/leaflet@1.9.4/dist/images/';

/** Centro padrão do mapa (São Paulo) */
const MAPA_CENTRO: L.LatLngTuple = [-23.5222, -46.6736];
const MAPA_ZOOM = 13;

/** Interface alinhada com as colunas exatas do PostgreSQL */
export interface Deteccao {
  id_deteccao: number;
  id_voo: number;
  latitude: number;
  longitude: number;
  confianca_ia: number;
  caminho_imagem: string;
  recorrente?: boolean;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, PercentPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit, AfterViewInit, OnDestroy {
  private readonly http = inject(HttpClient);

  /** Instância do mapa Leaflet */
  private map: L.Map | undefined;

  /** Camada que agrupa os marcadores (facilita limpar tudo de uma vez) */
  private camadaMarcadores: L.LayerGroup = L.layerGroup();

  /** Base pública das imagens servidas pelo StaticFiles do FastAPI */
  readonly urlImagens = `${API_URL}/imagens/`;

  registros: Deteccao[] = [];

  get deteccoes(): Deteccao[] {
    return this.registros;
  }
  set deteccoes(val: Deteccao[]) {
    this.registros = val;
  }

  carregando = false;
  erro = false;

  /** IDs cujas imagens falharam ao carregar (exibe placeholder no lugar) */
  imagensComErro = new Set<number>();

  constructor(private cdr: ChangeDetectorRef) {}

  /**
   * Monta a URL da thumbnail. O banco guarda "capturas/drone_frame_<ts>.jpg",
   * mas a pasta "capturas" já é a raiz do mount /imagens, então usamos só o nome do arquivo.
   */
  urlImagem(caminho: string): string {
    if (!caminho) return '';
    if (caminho.startsWith('http://') || caminho.startsWith('https://')) {
      return caminho;
    }
    const nomeArquivo = caminho.split(/[\\/]/).pop() ?? '';
    return this.urlImagens + encodeURIComponent(nomeArquivo);
  }

  onImagemErro(id: number) {
    this.imagensComErro.add(id);
  }

  ngOnInit() {
    this.carregarDados();
  }

  ngAfterViewInit() {
    this.initMap();
  }

  ngOnDestroy() {
    this.map?.remove();
    this.map = undefined;
  }

  /** Inicializa o mapa Leaflet centralizado em São Paulo com tema escuro */
  private initMap() {
    if (this.map) return;

    this.map = L.map('map', {
      center: MAPA_CENTRO,
      zoom: MAPA_ZOOM
    });

    // CartoDB Dark Matter (baseado em OpenStreetMap) para combinar com o layout dark
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(this.map);

    this.camadaMarcadores.addTo(this.map);

    // Garante o cálculo correto do tamanho após o layout do grid estabilizar
    setTimeout(() => this.map?.invalidateSize(), 0);

    // Caso a API tenha respondido antes da view estar pronta
    this.atualizarMarcadores();
  }

  /** Remove os marcadores antigos e plota um marcador por registro de detecção */
  private atualizarMarcadores() {
    if (!this.map) return;

    this.camadaMarcadores.clearLayers();

    const pontos: L.LatLngTuple[] = [];

    for (const reg of this.registros) {
      const lat = Number(reg.latitude);
      const lon = Number(reg.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

      const confianca = (Number(reg.confianca_ia) * 100).toFixed(1);
      const img = this.urlImagem(reg.caminho_imagem);

      const popupHtml = `
        <div style="min-width:160px;text-align:center;font-family:sans-serif">
          ${img
            ? `<a href="${img}" target="_blank" rel="noopener">
                 <img src="${img}" alt="Infração #${reg.id_deteccao}"
                      style="width:160px;height:110px;object-fit:cover;border-radius:6px;margin-bottom:6px"
                      onerror="this.style.display='none'" />
               </a>`
            : ''}
          <div><strong>ID:</strong> ${reg.id_deteccao}</div>
          <div><strong>Confiança:</strong> ${confianca}%</div>
        </div>`;

      L.marker([lat, lon])
        .bindPopup(popupHtml)
        .addTo(this.camadaMarcadores);

      pontos.push([lat, lon]);
    }

    // Enquadra todas as ocorrências na tela
    if (pontos.length > 0) {
      this.map.fitBounds(L.latLngBounds(pontos), { padding: [30, 30], maxZoom: 17 });
    }
  }

  /** Disparada pelo botão de atualizar dados */
  atualizarDados() {
    this.carregando = true;
    this.carregarDados();
  }

  /** Mantém compatibilidade com atualizarDashboard */
  atualizarDashboard() {
    this.atualizarDados();
  }

  /** Mantém compatibilidade com refresh */
  refresh() {
    this.atualizarDados();
  }

  /** Busca os registros de detecção salvos no backend */
  carregarDados() {
    this.carregando = true;
    this.erro = false;
    this.imagensComErro.clear();
    this.cdr.detectChanges();

    this.http.get<Deteccao[]>(`${API_URL}/deteccao/listar`)
      .pipe(
        finalize(() => {
          this.carregando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res) => {
          console.log('Dados do Banco:', res);
          this.registros = res;
          this.carregando = false;
          this.cdr.detectChanges();
          this.atualizarMarcadores();
        },
        error: (err) => {
          console.error('Erro ao carregar registros:', err);
          this.carregando = false;
          this.erro = true;
          this.cdr.detectChanges();
        }
      });
  }

  /** Mantém compatibilidade com carregarRegistros */
  carregarRegistros() {
    this.carregarDados();
  }
}
