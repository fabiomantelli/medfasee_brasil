# Projeto Medfasee Brasil

## Monitoramento do Sistema Elétrico Brasileiro em Tempo Real

Este projeto é uma modernização completa do sistema de monitoramento elétrico, desenvolvido com **Next.js 15**, **React 19** e **Tailwind CSS 4**.

## 🚀 Funcionalidades

### ✅ Implementadas
- **Dashboard em Tempo Real**: Métricas de frequência atualizadas a cada 2 segundos
- **Mapa Interativo do Brasil**: Visualização por regiões com cores indicativas de status
- **Gráfico de Histórico**: Acompanhamento da frequência ao longo do tempo
- **Sistema de Notificações**: Alertas automáticos para situações críticas
- **Design Responsivo**: Interface moderna que funciona em desktop e mobile
- **Modo Escuro**: Alternância entre temas claro e escuro
- **Indicadores Visuais**: Status em tempo real do sistema elétrico

### 📊 Métricas Monitoradas
- Frequência geral do sistema (Hz)
- Frequência por região (Norte, Nordeste, Sudeste, Sul, Centro-Oeste)
- Status operacional
- Histórico de variações
- Alertas de criticidade

## 🛠️ Tecnologias Utilizadas

- **Next.js 15** com App Router
- **React 19** com Hooks modernos
- **TypeScript** para tipagem estática
- **Tailwind CSS 4** para estilização
- **SVG** para gráficos e mapas vetoriais

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn

### Instalação
```bash
# Clone o repositório
git clone <url-do-repositorio>

# Entre no diretório
cd medfasee_brasil

# Instale as dependências
npm install

# Execute em modo de desenvolvimento
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`

### Build para Produção
```bash
# Gerar build otimizado
npm run build

# Executar em produção
npm start
```

## 📱 Interface

### Componentes Principais

1. **Header**: Navegação e controles (modo escuro, status online)
2. **Dashboard**: Métricas principais e indicadores por região
3. **Mapa do Brasil**: Visualização interativa das regiões
4. **Gráfico de Frequência**: Histórico em tempo real
5. **Sistema de Notificações**: Alertas flutuantes

### Indicadores de Status
- 🟢 **Verde**: Frequência normal (59.95-60.05 Hz)
- 🟡 **Amarelo**: Atenção (59.9-60.1 Hz)
- 🔴 **Vermelho**: Crítico (<59.9 ou >60.1 Hz)

## 🔧 Estrutura do Projeto

```
app/
├── components/
│   ├── Header.tsx              # Cabeçalho e navegação
│   ├── Dashboard.tsx           # Painel de métricas
│   ├── BrazilMap.tsx          # Mapa interativo
│   ├── FrequencyChart.tsx     # Gráfico de histórico
│   └── NotificationSystem.tsx # Sistema de alertas
├── globals.css                # Estilos globais
├── layout.tsx                 # Layout principal
└── page.tsx                   # Página inicial
```

## 🎯 Melhorias Implementadas

Comparado ao site antigo (www.medfasee.ufsc.br/brasil):

### ❌ Problemas do Site Antigo
- Interface desatualizada e pouco intuitiva
- Mapa estático sem interatividade
- Dados apresentados de forma básica
- Sem responsividade mobile
- Ausência de histórico visual
- Falta de sistema de alertas

### ✅ Soluções Implementadas
- **Interface Moderna**: Design limpo e profissional
- **Mapa Interativo**: Clique nas regiões para ver detalhes
- **Dados em Tempo Real**: Atualização automática a cada 2s
- **Totalmente Responsivo**: Funciona perfeitamente em mobile
- **Gráficos Dinâmicos**: Visualização do histórico de frequência
- **Sistema de Alertas**: Notificações automáticas para situações críticas
- **Modo Escuro**: Melhor experiência visual
- **Performance**: Carregamento rápido com Next.js 15

## 🔮 Próximas Funcionalidades

- Integração com APIs reais de dados elétricos
- Histórico persistente em banco de dados
- Relatórios exportáveis (PDF/Excel)
- Configurações personalizáveis de alertas
- Autenticação e controle de acesso
- Dashboard administrativo
- Integração com sistemas de monitoramento externos

## 📞 Suporte

Projeto desenvolvido para a **Universidade Federal de Santa Catarina (UFSC)**

---

**Desenvolvido com ❤️ usando as mais modernas tecnologias web**
