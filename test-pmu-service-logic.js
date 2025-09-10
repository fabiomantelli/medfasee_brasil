const WEBSERVICE_BASE_URL = 'http://150.162.19.214:6156';

// Simular a lógica do pmuService para a PMU Itaipu
const ITAIPU_PMU = {
  id: 'S_PR_Foz_do_Iguacu_Itaipu_Ptec',
  fullName: 'Itaipu_Ptec_Foz_do_Iguacu_PR',
  frequencyId: 1486,
  dfreqId: 1487,
  voltageIds: {
    A: { modId: 1503, angId: 1504 }
  }
};

// Simular como o pmuService coleta todos os IDs
function getAllHistorianIds() {
  const allIds = [];
  
  // Adicionar frequência e dfreq
  allIds.push(ITAIPU_PMU.frequencyId);  // 1486
  allIds.push(ITAIPU_PMU.dfreqId);      // 1487
  
  // Adicionar tensões (apenas fase A como no código atual)
  allIds.push(ITAIPU_PMU.voltageIds.A.modId);  // 1503
  allIds.push(ITAIPU_PMU.voltageIds.A.angId);  // 1504
  
  return allIds;
}

// Simular a busca de dados como no pmuService
async function testPMUServiceLogic() {
  try {
    console.log('🔍 Simulando lógica do pmuService para PMU Itaipu');
    console.log('📋 PMU configurada:', ITAIPU_PMU);
    console.log('');
    
    // 1. Coletar todos os IDs
    const allIds = getAllHistorianIds();
    console.log('🆔 IDs coletados:', allIds);
    console.log('');
    
    // 2. Fazer requisição como o pmuService faz
    const now = new Date();
    const startTime = now.toISOString().slice(0, 19).replace('T', ' ');
    const endTime = new Date(now.getTime() + 1000).toISOString().slice(0, 19).replace('T', ' ');
    
    console.log('📅 Período de busca:', startTime, 'até', endTime);
    
    const idsParam = allIds.join(',');
    const url = `${WEBSERVICE_BASE_URL}/historian/timeseriesdata/read/historic/${idsParam}/${encodeURIComponent(startTime)}/${encodeURIComponent(endTime)}/json`;
    
    console.log('🌐 URL da requisição:');
    console.log(url);
    console.log('');
    
    const response = await fetch(url);
    console.log('📡 Status da resposta:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      const dataPoints = data.TimeSeriesDataPoints || [];
      
      console.log('📊 Total de pontos recebidos:', dataPoints.length);
      console.log('');
      
      // 3. Simular o processamento como no pmuService
      console.log('🔍 Processando dados para PMU Itaipu...');
      
      const freqData = dataPoints.find(dp => dp.HistorianID === ITAIPU_PMU.frequencyId);
      const dfreqData = dataPoints.find(dp => dp.HistorianID === ITAIPU_PMU.dfreqId);
      const voltageAMag = dataPoints.find(dp => dp.HistorianID === ITAIPU_PMU.voltageIds.A.modId);
      const voltageAAng = dataPoints.find(dp => dp.HistorianID === ITAIPU_PMU.voltageIds.A.angId);
      
      console.log('📈 Dados encontrados:');
      console.log('   Frequência (1486):', freqData ? `${freqData.Value} Hz` : '❌ NÃO ENCONTRADO');
      console.log('   DFreq (1487):', dfreqData ? `${dfreqData.Value}` : '❌ NÃO ENCONTRADO');
      console.log('   Tensão Mag (1503):', voltageAMag ? `${voltageAMag.Value} kV` : '❌ NÃO ENCONTRADO');
      console.log('   Tensão Ang (1504):', voltageAAng ? `${voltageAAng.Value}°` : '❌ NÃO ENCONTRADO');
      console.log('');
      
      // 4. Aplicar filtros como no pmuService
      const hasValidVoltageA = voltageAMag && voltageAAng && 
                              voltageAMag.Value > 0 && 
                              !isNaN(voltageAMag.Value) && 
                              !isNaN(voltageAAng.Value);
      
      const hasValidFreqData = freqData && freqData.Value > 0 && !isNaN(freqData.Value);
      
      const hasRealData = hasValidFreqData && hasValidVoltageA;
      
      console.log('🔍 Verificação dos filtros:');
      console.log('   hasValidFreqData:', hasValidFreqData ? '✅ SIM' : '❌ NÃO');
      console.log('   hasValidVoltageA:', hasValidVoltageA ? '✅ SIM' : '❌ NÃO');
      console.log('   hasRealData (ambos):', hasRealData ? '✅ SIM' : '❌ NÃO');
      console.log('');
      
      if (hasRealData) {
        console.log('🎉 SUCESSO! PMU Itaipu seria APROVADA pelo filtro!');
        console.log('   Ela deveria aparecer no mapa com status "active"');
        
        const measurement = {
          pmuId: ITAIPU_PMU.id,
          pmuName: ITAIPU_PMU.fullName,
          frequency: freqData.Value,
          dfreq: dfreqData?.Value || 0.0,
          timestamp: freqData.Time,
          quality: freqData.Quality,
          status: 'active',
          voltageA: {
            magnitude: voltageAMag.Value,
            angle: voltageAAng.Value
          }
        };
        
        console.log('📋 Measurement que seria criado:');
        console.log(JSON.stringify(measurement, null, 2));
      } else {
        console.log('❌ FALHA! PMU Itaipu seria REJEITADA pelo filtro');
        console.log('   Motivo: dados incompletos ou inválidos');
      }
      
    } else {
      console.log('❌ Erro na requisição:', response.statusText);
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

console.log('🚀 Iniciando teste da lógica do pmuService...');
console.log('');
testPMUServiceLogic();