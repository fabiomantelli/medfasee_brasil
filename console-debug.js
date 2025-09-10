// Execute este código no console do navegador (F12 -> Console)

console.log('🔄 Iniciando debug manual do PMU Service...');

// Função para inicializar o PMU Service manualmente
async function initializePMUServiceManually() {
  try {
    console.log('🚀 Debug - Carregando módulos...');
    
    // Importar módulos necessários
    const xmlParserModule = await import('./app/utils/xmlParser.js');
    const pmuServiceModule = await import('./app/services/pmuService.js');
    
    console.log('🚀 Debug - Carregando dados XML...');
    const { pmus, config } = await xmlParserModule.loadPMUData();
    console.log(`🚀 Debug - ${pmus?.length || 0} PMUs carregadas!`);
    
    // Procurar pela PMU Itaipu
    const itaipu = pmus.find(pmu => pmu.fullName.includes('Itaipu'));
    if (itaipu) {
      console.log('🎯 Debug - PMU Itaipu encontrada:', itaipu);
    } else {
      console.log('❌ Debug - PMU Itaipu não encontrada');
    }
    
    console.log('🚀 Debug - Criando PMU Service...');
    const service = pmuServiceModule.PMUService.getInstance(config, pmus);
    
    // Expor no window para debug
    window.debugPMUService = service;
    console.log('🔍 Debug - PMU Service exposto em window.debugPMUService');
    
    console.log('🚀 Debug - Iniciando polling...');
    service.start();
    
    console.log('⚡ Debug - Forçando primeira atualização...');
    const measurements = await service.forceUpdate();
    
    console.log('📊 Debug - Medições recebidas:', measurements.length);
    
    // Procurar pela PMU Itaipu nas medições
    const itaipuMeasurement = measurements.find(m => m.pmuName.includes('Itaipu'));
    if (itaipuMeasurement) {
      console.log('✅ Debug - PMU Itaipu ENCONTRADA nas medições!', itaipuMeasurement);
    } else {
      console.log('❌ Debug - PMU Itaipu NÃO encontrada nas medições');
      console.log('📋 Debug - PMUs encontradas:', measurements.map(m => m.pmuName));
    }
    
    console.log('✅ Debug - Inicialização manual concluída!');
    
  } catch (error) {
    console.error('❌ Debug - Erro na inicialização manual:', error);
  }
}

// Executar a inicialização
initializePMUServiceManually();

// Função auxiliar para testar dados da Itaipu diretamente
async function testItaipuDirectly() {
  console.log('🔍 Debug - Testando dados da Itaipu diretamente...');
  
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 19).replace('T', ' ');
  const encodedTimestamp = encodeURIComponent(timestamp);
  
  const itaipuIds = '1486,1487,1503,1504'; // freq, dfreq, voltMag, voltAng
  const url = `http://150.162.19.214:6156/historian/timeseriesdata/read/historic/${itaipuIds}/${encodedTimestamp}/${encodedTimestamp}/json`;
  
  console.log('📡 Debug - URL da Itaipu:', url);
  
  try {
    const response = await fetch(url);
    console.log('📊 Debug - Status da resposta:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('📊 Debug - Dados da Itaipu:', data);
      
      if (data.TimeSeriesDataPoints && data.TimeSeriesDataPoints.length > 0) {
        console.log(`✅ Debug - Itaipu tem ${data.TimeSeriesDataPoints.length} pontos de dados`);
        data.TimeSeriesDataPoints.forEach(dp => {
          console.log(`   ID ${dp.HistorianID}: ${dp.Value} (Quality: ${dp.Quality})`);
        });
      } else {
        console.log('❌ Debug - Itaipu não tem dados (por isso não aparece no mapa)');
      }
    } else {
      console.log('❌ Debug - Erro na requisição:', response.statusText);
    }
  } catch (error) {
    console.error('❌ Debug - Erro na requisição:', error);
  }
}

// Executar teste direto também
setTimeout(() => {
  testItaipuDirectly();
}, 2000);