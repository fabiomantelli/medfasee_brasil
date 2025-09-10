// Usando fetch nativo do Node.js 18+

async function testItaipuCurrent() {
  const url = 'http://150.162.19.214:6156/historian/timeseriesdata/read/historic/1486,1487,1503,1504';
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60000);
  
  const formatDate = (date) => {
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${month}-${day}-${year}%20${hours}:${minutes}:${seconds}`;
  };
  
  const startTime = formatDate(oneMinuteAgo);
  const endTime = formatDate(now);
  const fullUrl = `${url}/${startTime}/${endTime}/json`;
  
  console.log('Testando PMU Itaipu com dados atuais:');
  console.log('URL:', fullUrl);
  
  try {
    const response = await fetch(fullUrl);
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Dados recebidos:', data.TimeSeriesDataPoints?.length || 0, 'pontos');
    
    if (data.TimeSeriesDataPoints?.length > 0) {
      const freqData = data.TimeSeriesDataPoints.filter(p => p.HistorianID === 1486);
      const dfreqData = data.TimeSeriesDataPoints.filter(p => p.HistorianID === 1487);
      const voltData = data.TimeSeriesDataPoints.filter(p => p.HistorianID === 1503);
      const angData = data.TimeSeriesDataPoints.filter(p => p.HistorianID === 1504);
      
      console.log('Frequência (1486):', freqData.length, 'pontos');
      console.log('dFreq (1487):', dfreqData.length, 'pontos');
      console.log('Tensão Mod (1503):', voltData.length, 'pontos');
      console.log('Tensão Ang (1504):', angData.length, 'pontos');
      
      if (freqData.length > 0) {
        console.log('Último valor freq:', freqData[freqData.length-1].Value, 'Hz');
      }
      if (voltData.length > 0) {
        console.log('Último valor tensão:', voltData[voltData.length-1].Value, 'V');
      }
      
      console.log('\n=== PMU ITAIPU TEM DADOS VÁLIDOS ===');
    } else {
      console.log('\n=== PMU ITAIPU SEM DADOS ===');
    }
  } catch (error) {
    console.error('Erro ao buscar dados:', error.message);
  }
}

testItaipuCurrent();