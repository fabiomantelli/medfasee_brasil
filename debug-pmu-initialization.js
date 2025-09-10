// Debug script para verificar inicialização do PMU Service

const WEBSERVICE_BASE_URL = 'http://150.162.19.214:6156';

// Testar se o webservice está acessível
async function testWebserviceConnection() {
  console.log('🔍 Testando conexão com webservice...');
  
  try {
    // Teste simples com um ID conhecido
    const now = new Date();
    const fiveSecondsAgo = new Date(now.getTime() - 5000);
    
    const formatDateTime = (date) => {
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      const year = String(date.getUTCFullYear()).slice(-2);
      const hours = String(date.getUTCHours()).padStart(2, '0');
      const minutes = String(date.getUTCMinutes()).padStart(2, '0');
      const seconds = String(date.getUTCSeconds()).padStart(2, '0');
      
      return `${month}-${day}-${year}%20${hours}:${minutes}:${seconds}.001`;
    };
    
    const timestamp = formatDateTime(fiveSecondsAgo);
    const url = `${WEBSERVICE_BASE_URL}/historian/timeseriesdata/read/historic/1486/${timestamp}/${timestamp}/json`;
    
    console.log('📡 URL de teste:', url);
    
    const response = await fetch(url);
    console.log('📊 Status da resposta:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Webservice acessível! Pontos recebidos:', data.TimeSeriesDataPoints?.length || 0);
      return true;
    } else {
      console.log('❌ Webservice retornou erro:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao conectar com webservice:', error.message);
    return false;
  }
}

// Testar carregamento do XML
async function testXMLLoading() {
  console.log('\n🔍 Testando carregamento do XML...');
  
  try {
    const fs = require('fs');
    const path = require('path');
    
    const xmlPath = path.join(__dirname, 'public', 'data.xml');
    console.log('📄 Caminho do XML:', xmlPath);
    
    if (fs.existsSync(xmlPath)) {
      const xmlText = fs.readFileSync(xmlPath, 'utf8');
      console.log('✅ XML carregado! Tamanho:', xmlText.length, 'caracteres');
      
      // Contar PMUs no XML
      const pmuMatches = xmlText.match(/<pmu>/g);
      const pmuCount = pmuMatches ? pmuMatches.length : 0;
      console.log('📊 PMUs encontradas no XML:', pmuCount);
      
      // Verificar se Itaipu está no XML
      const itaipuFound = xmlText.includes('Itaipu');
      console.log('🎯 PMU Itaipu encontrada no XML:', itaipuFound);
      
      if (itaipuFound) {
        // Extrair IDs da Itaipu
        const itaipuSection = xmlText.substring(
          xmlText.indexOf('Itaipu') - 200,
          xmlText.indexOf('Itaipu') + 500
        );
        console.log('🔍 Seção Itaipu (parcial):', itaipuSection.substring(0, 200) + '...');
      }
      
      return true;
    } else {
      console.log('❌ Arquivo XML não encontrado:', xmlPath);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao processar XML:', error.message);
    return false;
  }
}

// Executar testes
async function runDiagnostics() {
  console.log('🚀 Iniciando diagnóstico do PMU Service...');
  console.log('='.repeat(50));
  
  const webserviceOk = await testWebserviceConnection();
  const xmlOk = await testXMLLoading();
  
  console.log('\n📋 RESUMO DO DIAGNÓSTICO:');
  console.log('='.repeat(30));
  console.log('🌐 Webservice:', webserviceOk ? '✅ OK' : '❌ FALHA');
  console.log('📄 XML:', xmlOk ? '✅ OK' : '❌ FALHA');
  
  if (webserviceOk && xmlOk) {
    console.log('\n🎉 Todos os componentes estão funcionando!');
    console.log('💡 O problema pode estar na inicialização do PMU Service no frontend.');
  } else {
    console.log('\n⚠️ Problemas detectados nos componentes básicos.');
  }
}

runDiagnostics();