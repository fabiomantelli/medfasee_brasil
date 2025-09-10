const WEBSERVICE_BASE_URL = 'http://150.162.19.214:6156';

// PMU Itaipu_Ptec_Foz_do_Iguacu_PR IDs from data.xml
const ITAIPU_IDS = {
  frequency: 1486,
  dfreq: 1487,
  voltageA_mod: 1503,  // TENSAO_A magnitude
  voltageA_ang: 1504   // TENSAO_A angle
};

// Test current timestamp (now)
const now = new Date();
const startTime = now.toISOString().slice(0, 19).replace('T', ' ');
const endTime = new Date(now.getTime() + 1000).toISOString().slice(0, 19).replace('T', ' ');

console.log('🔍 Testando dados de tensão da PMU Itaipu_Ptec_Foz_do_Iguacu_PR');
console.log('📅 Período:', startTime, 'até', endTime);
console.log('🆔 IDs testados:', ITAIPU_IDS);
console.log('');

async function testItaipuVoltageData() {
  try {
    // Test voltage magnitude (ID 1503)
    console.log('🔋 Testando TENSAO_A magnitude (ID 1503)...');
    const voltMagUrl = `${WEBSERVICE_BASE_URL}/historian/timeseriesdata/read/historic/${ITAIPU_IDS.voltageA_mod}/${encodeURIComponent(startTime)}/${encodeURIComponent(endTime)}/json`;
    console.log('URL:', voltMagUrl);
    
    const voltMagResponse = await fetch(voltMagUrl);
    console.log('Status:', voltMagResponse.status);
    
    if (voltMagResponse.ok) {
      const voltMagData = await voltMagResponse.json();
      console.log('Dados recebidos:', voltMagData.TimeSeriesDataPoints?.length || 0, 'pontos');
      if (voltMagData.TimeSeriesDataPoints?.length > 0) {
        const sample = voltMagData.TimeSeriesDataPoints[0];
        console.log('✅ Amostra:', {
          HistorianID: sample.HistorianID,
          Value: sample.Value,
          Quality: sample.Quality,
          Time: sample.Time
        });
      } else {
        console.log('❌ Nenhum dado encontrado para magnitude de tensão');
      }
    } else {
      console.log('❌ Erro na requisição:', voltMagResponse.statusText);
    }
    
    console.log('');
    
    // Test voltage angle (ID 1504)
    console.log('📐 Testando TENSAO_A ângulo (ID 1504)...');
    const voltAngUrl = `${WEBSERVICE_BASE_URL}/historian/timeseriesdata/read/historic/${ITAIPU_IDS.voltageA_ang}/${encodeURIComponent(startTime)}/${encodeURIComponent(endTime)}/json`;
    console.log('URL:', voltAngUrl);
    
    const voltAngResponse = await fetch(voltAngUrl);
    console.log('Status:', voltAngResponse.status);
    
    if (voltAngResponse.ok) {
      const voltAngData = await voltAngResponse.json();
      console.log('Dados recebidos:', voltAngData.TimeSeriesDataPoints?.length || 0, 'pontos');
      if (voltAngData.TimeSeriesDataPoints?.length > 0) {
        const sample = voltAngData.TimeSeriesDataPoints[0];
        console.log('✅ Amostra:', {
          HistorianID: sample.HistorianID,
          Value: sample.Value,
          Quality: sample.Quality,
          Time: sample.Time
        });
      } else {
        console.log('❌ Nenhum dado encontrado para ângulo de tensão');
      }
    } else {
      console.log('❌ Erro na requisição:', voltAngResponse.statusText);
    }
    
    console.log('');
    
    // Test combined voltage data (magnitude + angle)
    console.log('🔋📐 Testando dados combinados de tensão (magnitude + ângulo)...');
    const combinedUrl = `${WEBSERVICE_BASE_URL}/historian/timeseriesdata/read/historic/${ITAIPU_IDS.voltageA_mod},${ITAIPU_IDS.voltageA_ang}/${encodeURIComponent(startTime)}/${encodeURIComponent(endTime)}/json`;
    console.log('URL:', combinedUrl);
    
    const combinedResponse = await fetch(combinedUrl);
    console.log('Status:', combinedResponse.status);
    
    if (combinedResponse.ok) {
      const combinedData = await combinedResponse.json();
      console.log('Dados recebidos:', combinedData.TimeSeriesDataPoints?.length || 0, 'pontos');
      
      if (combinedData.TimeSeriesDataPoints?.length > 0) {
        const magData = combinedData.TimeSeriesDataPoints.filter(dp => dp.HistorianID === ITAIPU_IDS.voltageA_mod);
        const angData = combinedData.TimeSeriesDataPoints.filter(dp => dp.HistorianID === ITAIPU_IDS.voltageA_ang);
        
        console.log('📊 Magnitude pontos:', magData.length);
        console.log('📊 Ângulo pontos:', angData.length);
        
        if (magData.length > 0 && angData.length > 0) {
          const magSample = magData[0];
          const angSample = angData[0];
          
          console.log('✅ Dados de tensão válidos encontrados!');
          console.log('   Magnitude:', magSample.Value, 'kV (Quality:', magSample.Quality + ')');
          console.log('   Ângulo:', angSample.Value, '° (Quality:', angSample.Quality + ')');
          
          // Verificar se passaria no filtro do pmuService
          const hasValidVoltageA = magSample && angSample && 
                                  magSample.Value > 0 && 
                                  !isNaN(magSample.Value) && 
                                  !isNaN(angSample.Value);
          
          console.log('🔍 Passaria no filtro do pmuService?', hasValidVoltageA ? '✅ SIM' : '❌ NÃO');
        } else {
          console.log('❌ Dados incompletos - faltam magnitude ou ângulo');
        }
      } else {
        console.log('❌ Nenhum dado encontrado para tensão combinada');
      }
    } else {
      console.log('❌ Erro na requisição:', combinedResponse.statusText);
    }
    
    console.log('');
    console.log('🎯 CONCLUSÃO:');
    console.log('   A PMU Itaipu precisa de dados válidos de:');
    console.log('   1. Frequência (ID 1486) ✅ - já confirmado que tem dados');
    console.log('   2. Tensão magnitude (ID 1503) - testado acima');
    console.log('   3. Tensão ângulo (ID 1504) - testado acima');
    console.log('   ');
    console.log('   Para aparecer no mapa, TODOS os três devem ter dados válidos!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

testItaipuVoltageData();