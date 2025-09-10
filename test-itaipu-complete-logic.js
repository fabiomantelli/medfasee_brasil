// Teste COMPLETO da lógica do pmuService para PMU Itaipu
// Agora com IDs corretos de frequência E tensão confirmados

const WEBSERVICE_BASE_URL = 'http://150.162.19.214:6156';

// IDs CONFIRMADOS da PMU Itaipu
const ITAIPU_IDS = {
  frequency: 1486,    // CONFIRMADO pelo usuário - tem dados!
  dfreq: 1487,        // CONFIRMADO pelo usuário
  voltageAMag: 1503,  // CONFIRMADO pelo usuário
  voltageAAng: 1504   // CONFIRMADO pelo usuário
};

async function testItaipuCompleteLogic() {
  console.log('🎯 TESTE FINAL: PMU Itaipu com IDs CORRETOS de frequência E tensão');
  console.log('===============================================================\n');
  
  try {
    // Usar formato correto com milissegundos (descoberto pelo usuário)
    const startTime = '2025-09-10 11:00:00';
    const endTime = '2025-09-10 11:00:00.001';  // SEGREDO: .001 milissegundos!
    
    console.log('🎯 USANDO FORMATO CORRETO COM MILISSEGUNDOS (.001)');
    console.log('📅 Intervalo:', startTime, 'até', endTime);
    console.log('🆔 IDs da Itaipu:');
    console.log('   Frequência:', ITAIPU_IDS.frequency);
    console.log('   DFreq:', ITAIPU_IDS.dfreq);
    console.log('   Tensão Mag:', ITAIPU_IDS.voltageAMag);
    console.log('   Tensão Ang:', ITAIPU_IDS.voltageAAng);
    console.log('');
    
    // TESTE 1: Apenas frequência (confirmado pelo usuário)
     console.log('🧪 TESTE 1: Apenas IDs de frequência');
     const freqIds = `${ITAIPU_IDS.frequency},${ITAIPU_IDS.dfreq}`;
     const freqUrl = `${WEBSERVICE_BASE_URL}/historian/timeseriesdata/read/historic/${freqIds}/${encodeURIComponent(startTime)}/${encodeURIComponent(endTime)}/json`;
    
    console.log('🌐 URL frequência:', freqUrl);
    
    const freqResponse = await fetch(freqUrl);
    console.log('📡 Status frequência:', freqResponse.status);
    
    let freqData = null, dfreqData = null;
    if (freqResponse.ok) {
      const freqDataResponse = await freqResponse.json();
      const freqPoints = freqDataResponse.TimeSeriesDataPoints || [];
      console.log('📊 Pontos de frequência:', freqPoints.length);
      
      freqData = freqPoints.find(dp => dp.HistorianID === ITAIPU_IDS.frequency);
      dfreqData = freqPoints.find(dp => dp.HistorianID === ITAIPU_IDS.dfreq);
      
      console.log('   Freq (1486):', freqData ? `${freqData.Value} Hz` : 'NÃO ENCONTRADO');
      console.log('   DFreq (1487):', dfreqData ? `${dfreqData.Value}` : 'NÃO ENCONTRADO');
    }
    
    console.log('');
    
    // TESTE 2: Apenas tensão
     console.log('🧪 TESTE 2: Apenas IDs de tensão');
     const voltIds = `${ITAIPU_IDS.voltageAMag},${ITAIPU_IDS.voltageAAng}`;
     const voltUrl = `${WEBSERVICE_BASE_URL}/historian/timeseriesdata/read/historic/${voltIds}/${encodeURIComponent(startTime)}/${encodeURIComponent(endTime)}/json`;
    
    console.log('🌐 URL tensão:', voltUrl);
    
    const voltResponse = await fetch(voltUrl);
    console.log('📡 Status tensão:', voltResponse.status);
    
    let voltageAMag = null, voltageAAng = null;
    if (voltResponse.ok) {
      const voltDataResponse = await voltResponse.json();
      const voltPoints = voltDataResponse.TimeSeriesDataPoints || [];
      console.log('📊 Pontos de tensão:', voltPoints.length);
      
      voltageAMag = voltPoints.find(dp => dp.HistorianID === ITAIPU_IDS.voltageAMag);
      voltageAAng = voltPoints.find(dp => dp.HistorianID === ITAIPU_IDS.voltageAAng);
      
      console.log('   Tensão Mag (1503):', voltageAMag ? `${voltageAMag.Value} kV` : 'NÃO ENCONTRADO');
      console.log('   Tensão Ang (1504):', voltageAAng ? `${voltageAAng.Value}°` : 'NÃO ENCONTRADO');
    }
    
    console.log('');
    
    // TESTE 3: Todos juntos
     console.log('🧪 TESTE 3: Todos os IDs juntos');
     const allIds = `${ITAIPU_IDS.frequency},${ITAIPU_IDS.dfreq},${ITAIPU_IDS.voltageAMag},${ITAIPU_IDS.voltageAAng}`;
     const allUrl = `${WEBSERVICE_BASE_URL}/historian/timeseriesdata/read/historic/${allIds}/${encodeURIComponent(startTime)}/${encodeURIComponent(endTime)}/json`;
    
    console.log('🌐 URL completa:', allUrl);
    
    const allResponse = await fetch(allUrl);
    console.log('📡 Status completo:', allResponse.status);
    
    if (allResponse.ok) {
      const allData = await allResponse.json();
      const allPoints = allData.TimeSeriesDataPoints || [];
      console.log('📊 Pontos completos:', allPoints.length);
      
      // Se não temos dados dos testes individuais, tentar extrair dos dados completos
      if (!freqData) freqData = allPoints.find(dp => dp.HistorianID === ITAIPU_IDS.frequency);
      if (!dfreqData) dfreqData = allPoints.find(dp => dp.HistorianID === ITAIPU_IDS.dfreq);
      if (!voltageAMag) voltageAMag = allPoints.find(dp => dp.HistorianID === ITAIPU_IDS.voltageAMag);
      if (!voltageAAng) voltageAAng = allPoints.find(dp => dp.HistorianID === ITAIPU_IDS.voltageAAng);
    }
    
    console.log('');
      
      console.log('🔍 Dados extraídos:');
      console.log('   Frequência (1486):', freqData ? `${freqData.Value} Hz (Quality: ${freqData.Quality})` : '❌ NÃO ENCONTRADO');
      console.log('   DFreq (1487):', dfreqData ? `${dfreqData.Value} (Quality: ${dfreqData.Quality})` : '❌ NÃO ENCONTRADO');
      console.log('   Tensão Mag (1503):', voltageAMag ? `${voltageAMag.Value} kV (Quality: ${voltageAMag.Quality})` : '❌ NÃO ENCONTRADO');
      console.log('   Tensão Ang (1504):', voltageAAng ? `${voltageAAng.Value}° (Quality: ${voltageAAng.Quality})` : '❌ NÃO ENCONTRADO');
      console.log('');
      
      // Aplicar EXATAMENTE os mesmos filtros do pmuService
      const hasValidVoltageA = voltageAMag && voltageAAng && 
                              voltageAMag.Value > 0 && 
                              !isNaN(voltageAMag.Value) && 
                              !isNaN(voltageAAng.Value);
      
      const hasValidFreqData = freqData && freqData.Value > 0 && !isNaN(freqData.Value);
      
      const hasRealData = hasValidFreqData && hasValidVoltageA;
      
      console.log('🧪 FILTROS DO PMUSERVICE:');
      console.log('   hasValidFreqData:', hasValidFreqData ? '✅ PASSOU' : '❌ FALHOU');
      console.log('   hasValidVoltageA:', hasValidVoltageA ? '✅ PASSOU' : '❌ FALHOU');
      console.log('   hasRealData (ambos):', hasRealData ? '✅ PASSOU' : '❌ FALHOU');
      console.log('');
      
      if (hasRealData) {
        console.log('🎉 SUCESSO TOTAL! PMU Itaipu PASSARIA em todos os filtros!');
        console.log('   ✅ Tem dados de frequência válidos');
        console.log('   ✅ Tem dados de tensão válidos');
        console.log('   ✅ Deveria aparecer VERDE no mapa!');
        console.log('');
        
        // Criar o measurement exato que seria gerado
        const measurement = {
          pmuId: 'S_PR_Foz_do_Iguacu_Itaipu_Ptec',
          pmuName: 'Itaipu_Ptec_Foz_do_Iguacu_PR',
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
        
        console.log('📋 MEASUREMENT que seria criado:');
        console.log(JSON.stringify(measurement, null, 2));
        console.log('');
        
        console.log('🚨 CONCLUSÃO: Se a PMU Itaipu ainda aparece vermelha, o problema é:');
        console.log('   1. 🕐 Timing - dados chegam após o filtro ser aplicado');
        console.log('   2. 🔄 Cache - dados antigos sendo usados');
        console.log('   3. 🐛 Bug no código - filtro não sendo aplicado corretamente');
        console.log('   4. 🌐 Problema de rede - dados não chegando ao frontend');
        
      } else {
        console.log('❌ FALHA! PMU Itaipu seria REJEITADA pelo filtro');
        console.log('   Motivos específicos:');
        if (!hasValidFreqData) {
          console.log('   - Dados de frequência inválidos ou ausentes');
          if (freqData) console.log(`     Valor: ${freqData.Value}, Válido: ${freqData.Value > 0 && !isNaN(freqData.Value)}`);
        }
        if (!hasValidVoltageA) {
          console.log('   - Dados de tensão inválidos ou ausentes');
          if (voltageAMag) console.log(`     Mag: ${voltageAMag.Value}, Válido: ${voltageAMag.Value > 0 && !isNaN(voltageAMag.Value)}`);
          if (voltageAAng) console.log(`     Ang: ${voltageAAng.Value}, Válido: ${!isNaN(voltageAAng.Value)}`);
        }
      }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    console.log('   A PMU Itaipu aparece vermelha devido a erro de conexão');
  }
}

console.log('🚀 Iniciando teste COMPLETO da PMU Itaipu...');
console.log('');
testItaipuCompleteLogic();