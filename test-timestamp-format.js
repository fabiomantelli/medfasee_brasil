// Script para testar o formato de timestamp usado no PMU Service
const http = require('http');

// Função de formatação atual do PMU Service
const formatDateTime = (date) => {
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const year = String(date.getUTCFullYear()).slice(-2);
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  
  return `${month}-${day}-${year}%20${hours}:${minutes}:${seconds}`;
};

// Teste com timestamp atual
const now = new Date();
const fiveSecondsAgo = new Date(now.getTime() - 5000);
const formattedTimestamp = formatDateTime(fiveSecondsAgo);

console.log('🕐 Timestamp atual:', now.toISOString());
console.log('🕐 5 segundos atrás:', fiveSecondsAgo.toISOString());
console.log('🕐 Formato usado pelo sistema:', formattedTimestamp);
console.log('🕐 Exemplo que funciona: 08-09-25%2018:00:00');

// Teste de conectividade com timestamp atual
function testWithCurrentTimestamp() {
  return new Promise((resolve, reject) => {
    const testIds = '846,847'; // IDs da PMU Macapá UNIFAP
    const path = `/historian/timeseriesdata/read/historic/${testIds}/${formattedTimestamp}/${formattedTimestamp}/json`;
    
    const options = {
      hostname: '150.162.19.214',
      port: 6156,
      path: path,
      method: 'GET',
      timeout: 10000
    };

    console.log(`\n🎯 Testando com timestamp atual:`);
    console.log(`📡 URL: http://150.162.19.214:6156${path}`);

    const req = http.request(options, (res) => {
      console.log(`✅ Status: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          const dataPoints = jsonData.TimeSeriesDataPoints || [];
          console.log(`📊 Dados recebidos: ${dataPoints.length} pontos`);
          
          if (dataPoints.length > 0) {
            console.log('✅ SUCESSO: Dados encontrados!');
            console.log('📋 Primeiro ponto:', dataPoints[0]);
            console.log('📋 Último ponto:', dataPoints[dataPoints.length - 1]);
          } else {
            console.log('⚠️ Nenhum dado encontrado para este timestamp');
          }
          
          resolve({ status: res.statusCode, dataPoints });
        } catch (e) {
          console.log('📄 Resposta não é JSON válido:', data.substring(0, 200));
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', (err) => {
      console.error('❌ Erro:', err.message);
      reject(err);
    });

    req.on('timeout', () => {
      console.error('⏰ Timeout');
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.end();
  });
}

// Teste com timestamp do exemplo que funciona
function testWithWorkingTimestamp() {
  return new Promise((resolve, reject) => {
    const testIds = '846,847';
    const workingTimestamp = '08-09-25%2018:00:00';
    const path = `/historian/timeseriesdata/read/historic/${testIds}/${workingTimestamp}/${workingTimestamp}/json`;
    
    const options = {
      hostname: '150.162.19.214',
      port: 6156,
      path: path,
      method: 'GET',
      timeout: 10000
    };

    console.log(`\n🎯 Testando com timestamp que sabemos que funciona:`);
    console.log(`📡 URL: http://150.162.19.214:6156${path}`);

    const req = http.request(options, (res) => {
      console.log(`✅ Status: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          const dataPoints = jsonData.TimeSeriesDataPoints || [];
          console.log(`📊 Dados recebidos: ${dataPoints.length} pontos`);
          
          if (dataPoints.length > 0) {
            console.log('✅ CONFIRMADO: Timestamp do exemplo funciona!');
            console.log('📋 Primeiro ponto:', dataPoints[0]);
          }
          
          resolve({ status: res.statusCode, dataPoints });
        } catch (e) {
          console.log('📄 Resposta:', data.substring(0, 200));
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', (err) => {
      console.error('❌ Erro:', err.message);
      reject(err);
    });

    req.on('timeout', () => {
      console.error('⏰ Timeout');
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.end();
  });
}

// Executar testes
async function runTests() {
  try {
    console.log('=== TESTE DE FORMATO DE TIMESTAMP ===\n');
    
    // Teste 1: Timestamp do exemplo que funciona
    await testWithWorkingTimestamp();
    
    // Teste 2: Timestamp atual formatado pelo sistema
    await testWithCurrentTimestamp();
    
    console.log('\n=== ANÁLISE CONCLUÍDA ===');
    
  } catch (error) {
    console.error('❌ Erro nos testes:', error);
  }
}

runTests();