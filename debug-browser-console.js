// Execute este código no console do navegador (F12 -> Console)
// para debugar o problema da PMU Itaipu

console.log('🔍 DEBUG: Investigando PMU Itaipu no navegador...');

// 1. Verificar se o pmuService está funcionando
if (window.pmuService) {
  console.log('✅ pmuService encontrado no window');
  
  // Forçar atualização
  window.pmuService.forceUpdate().then(measurements => {
    console.log('📊 Total de medições:', measurements.length);
    
    // Procurar pela PMU Itaipu
    const itaipu = measurements.find(m => 
      m.pmuId === 'S_PR_Foz_do_Iguacu_Itaipu_Ptec' || 
      m.pmuName.includes('Itaipu')
    );
    
    if (itaipu) {
      console.log('🎉 PMU Itaipu ENCONTRADA nas medições!', itaipu);
    } else {
      console.log('❌ PMU Itaipu NÃO encontrada nas medições');
      console.log('📋 PMUs disponíveis:');
      measurements.forEach((m, i) => {
        console.log(`  ${i + 1}. ${m.pmuName} (${m.frequency}Hz) - ID: ${m.pmuId}`);
      });
    }
  }).catch(error => {
    console.error('❌ Erro ao forçar atualização:', error);
  });
} else {
  console.log('❌ pmuService não encontrado no window');
}

// 2. Verificar o store do dashboard
if (window.__DASHBOARD_STORE__) {
  console.log('✅ Dashboard store encontrado');
  const store = window.__DASHBOARD_STORE__;
  console.log('📊 Store state:', store.getState());
} else {
  console.log('❌ Dashboard store não encontrado');
}

// 3. Verificar se há erros de rede
console.log('🌐 Verificando requisições de rede...');
console.log('Abra a aba Network (Rede) no DevTools para ver as requisições ao webservice');

// 4. Verificar se o XML foi carregado corretamente
fetch('/data.xml')
  .then(response => response.text())
  .then(xml => {
    const hasItaipu = xml.includes('S_PR_Foz_do_Iguacu_Itaipu_Ptec');
    console.log('📄 XML carregado, tamanho:', xml.length);
    console.log('🔍 PMU Itaipu no XML:', hasItaipu ? '✅ SIM' : '❌ NÃO');
    
    if (hasItaipu) {
      // Extrair dados da PMU Itaipu do XML
      const pmuMatch = xml.match(/<pmu>[\s\S]*?<idName>S_PR_Foz_do_Iguacu_Itaipu_Ptec<\/idName>[\s\S]*?<\/pmu>/);
      if (pmuMatch) {
        console.log('📋 Dados da PMU Itaipu no XML:');
        console.log(pmuMatch[0].substring(0, 500) + '...');
      }
    }
  })
  .catch(error => {
    console.error('❌ Erro ao carregar XML:', error);
  });

// 5. Testar diretamente o webservice
const testWebservice = async () => {
  const url = 'http://150.162.19.214:6156/historian/timeseriesdata/read/historic/1486,1487,1503,1504';
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60000);
  
  const formatDate = (date) => {
    return date.toISOString().slice(0, 19).replace('T', ' ');
  };
  
  const startTime = encodeURIComponent(formatDate(oneMinuteAgo));
  const endTime = encodeURIComponent(formatDate(now));
  const fullUrl = `${url}/${startTime}/${endTime}/json`;
  
  console.log('🌐 Testando webservice diretamente...');
  console.log('📡 URL:', fullUrl);
  
  try {
    const response = await fetch(fullUrl);
    const data = await response.json();
    console.log('📊 Resposta do webservice:', {
      status: response.status,
      pontos: data.TimeSeriesDataPoints?.length || 0,
      temFreq: data.TimeSeriesDataPoints?.some(p => p.HistorianID === 1486),
      temTensao: data.TimeSeriesDataPoints?.some(p => p.HistorianID === 1503)
    });
  } catch (error) {
    console.error('❌ Erro no webservice:', error);
  }
};

testWebservice();

console.log('🔍 DEBUG concluído. Verifique os logs acima para identificar o problema.');