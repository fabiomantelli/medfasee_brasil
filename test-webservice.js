// Script para testar o webservice PMU
const https = require('https');
const http = require('http');

// Configuração do webservice do XML
const webserviceConfig = {
  host: '150.162.19.214',
  port: 6156
};

console.log('🔍 Testando webservice PMU...');
console.log(`📡 Endereço: ${webserviceConfig.host}:${webserviceConfig.port}`);

// Função para testar conexão básica
function testConnection() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: webserviceConfig.host,
      port: webserviceConfig.port,
      method: 'GET',
      timeout: 10000
    };

    const req = http.request(options, (res) => {
      console.log(`✅ Status: ${res.statusCode}`);
      console.log(`📋 Headers:`, res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📊 Dados recebidos (${data.length} bytes):`);
        console.log(data.substring(0, 500)); // Primeiros 500 caracteres
        resolve({ status: res.statusCode, data, headers: res.headers });
      });
    });

    req.on('error', (err) => {
      console.error('❌ Erro de conexão:', err.message);
      reject(err);
    });

    req.on('timeout', () => {
      console.error('⏰ Timeout na conexão');
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.end();
  });
}

// Função para testar endpoint específico da API historian
function testHistorianAPI() {
  return new Promise((resolve, reject) => {
    const path = '/api/historian/timeseriesdata/read/historic/115';
    const options = {
      hostname: webserviceConfig.host,
      port: webserviceConfig.port,
      path: path,
      method: 'GET',
      timeout: 10000
    };

    console.log(`🎯 Testando endpoint: ${path}`);

    const req = http.request(options, (res) => {
      console.log(`✅ API Status: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📊 API Dados (${data.length} bytes):`);
        try {
          const jsonData = JSON.parse(data);
          console.log('📋 JSON válido:', JSON.stringify(jsonData, null, 2).substring(0, 500));
        } catch (e) {
          console.log('📄 Dados brutos:', data.substring(0, 500));
        }
        resolve({ status: res.statusCode, data });
      });
    });

    req.on('error', (err) => {
      console.error('❌ Erro na API:', err.message);
      reject(err);
    });

    req.on('timeout', () => {
      console.error('⏰ Timeout na API');
      req.destroy();
      reject(new Error('API Timeout'));
    });

    req.end();
  });
}

// Executar testes
async function runTests() {
  try {
    console.log('\n=== TESTE 1: Conexão Básica ===');
    await testConnection();
    
    console.log('\n=== TESTE 2: API Historian ===');
    await testHistorianAPI();
    
    console.log('\n✅ Todos os testes concluídos!');
  } catch (error) {
    console.error('\n❌ Falha nos testes:', error.message);
  }
}

runTests();