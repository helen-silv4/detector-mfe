## 🛩️ **Drone Waste Monitoring - Frontend**

Frontend em Angular do painel de controle do drone, responsável por exibir o vídeo, telemetria básica e disparar rotinas de teste/voo através da API.

Este repositório faz parte do TCC Drone Waste Monitoring, junto com:
- [detector_de_lixo](https://github.com/Jhonydev72/detector_de_lixo): scripts de controle de voo, visão computacional e YOLOv8
- [detector-api](https://github.com/helen-silv4/detector-api): API que intermedia a comunicação entre o frontend e o drone

### **Status atual**

🚧 Em desenvolvimento. Consumindo endpoints simulados (mock) da API enquanto o drone físico não está disponível para testes.

### **Requisitos**

- Node.js 24+
- Angular CLI (`npm install -g @angular/cli`)
- [detector-api](https://github.com/helen-silv4/detector-api) rodando em `http://localhost:8000`

### **Configuração**

Clone o repositório e entre na pasta:

```bash
git clone https://github.com/helen-silv4/detector-mfe.git
cd detector-mfe
```

Instale as dependências:

```bash
npm install
```

### **Execução**

Certifique-se de que a API (`detector-api`) está rodando antes de iniciar o frontend.

```bash
ng serve
```

Acesse `http://localhost:4200/`. A aplicação recarrega automaticamente ao salvar alterações.

### **Build**

```bash
ng build
```

Os arquivos compilados vão para `dist/`.

### **Testes**

```bash
ng test
```

### **Próximos passos**

- Consumir os endpoints de teste (`/testes/voo`, `/testes/video`, `/testes/voo-video`)
- Tela de Detecção (vídeo + telemetria + ações de voo)