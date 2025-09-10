// Test script for PMUs that are known to work
// Testing PMUs that appear on the map to compare with Itaipu

const WEBSERVICE_BASE_URL = 'http://150.162.19.214:6156';

// Format timestamp for webservice API (YYYY-MM-DD HH:mm:ss)
function formatTimestamp(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

async function testWorkingPMUs() {
  console.log('🔍 Testing PMUs that should be working...');
  console.log('🌐 Webservice URL:', WEBSERVICE_BASE_URL);
  
  // PMUs from XML that might have data (first few from the list)
  const TEST_PMUS = {
    'UFPA_Belem_PA': {
      frequency: 115,
      dfreq: 116,
      voltageAMag: 118,
      voltageAAng: 119
    },
    'UNIFEI_Itajuba_MG': {
      frequency: 160,
      dfreq: 161,
      voltageAMag: 163,
      voltageAAng: 164
    },
    'UFC_Fortaleza_CE': {
      frequency: 250,
      dfreq: 251,
      voltageAMag: 253,
      voltageAAng: 254
    }
  };
  
  // Test current time - 5 seconds (like PMU Service does)
  const now = new Date();
  const fiveSecondsAgo = new Date(now.getTime() - 5000);
  
  const timestamp = formatTimestamp(fiveSecondsAgo);
  
  console.log('⏰ Testing timestamp:', fiveSecondsAgo.toISOString(), '->', timestamp);
  
  for (const [pmuName, ids] of Object.entries(TEST_PMUS)) {
    console.log(`\n🔍 Testing PMU: ${pmuName}`);
    console.log('📊 IDs:', ids);
    
    // Test combined request (like PMU Service does)
    const allIds = `${ids.frequency},${ids.dfreq},${ids.voltageAMag},${ids.voltageAAng}`;
    const combinedUrl = `${WEBSERVICE_BASE_URL}/historian/timeseriesdata/read/historic/${allIds}/${timestamp}/${timestamp}/json`;
    console.log('📡 URL:', combinedUrl);
    
    try {
      const combinedResponse = await fetch(combinedUrl);
      console.log('📊 Response Status:', combinedResponse.status);
      
      if (combinedResponse.ok) {
        const combinedData = await combinedResponse.json();
        
        if (combinedData.TimeSeriesDataPoints && combinedData.TimeSeriesDataPoints.length > 0) {
          console.log(`✅ ${pmuName} - Found ${combinedData.TimeSeriesDataPoints.length} data points`);
          
          const freqPoint = combinedData.TimeSeriesDataPoints.find(p => p.HistorianID === ids.frequency);
          const dfreqPoint = combinedData.TimeSeriesDataPoints.find(p => p.HistorianID === ids.dfreq);
          const voltageMagPoint = combinedData.TimeSeriesDataPoints.find(p => p.HistorianID === ids.voltageAMag);
          const voltageAngPoint = combinedData.TimeSeriesDataPoints.find(p => p.HistorianID === ids.voltageAAng);
          
          console.log('🔍 Frequency:', freqPoint ? `${freqPoint.Value} Hz` : 'NOT FOUND');
          console.log('🔍 dfreq:', dfreqPoint ? `${dfreqPoint.Value} Hz/s` : 'NOT FOUND');
          console.log('🔍 Voltage Mag:', voltageMagPoint ? `${voltageMagPoint.Value} kV` : 'NOT FOUND');
          console.log('🔍 Voltage Ang:', voltageAngPoint ? `${voltageAngPoint.Value}°` : 'NOT FOUND');
          
          // Check PMU Service filter conditions
          const hasValidFreq = freqPoint && freqPoint.Value > 0 && !isNaN(freqPoint.Value);
          const hasValidVoltage = voltageMagPoint && voltageAngPoint && 
                                 voltageMagPoint.Value > 0 && 
                                 !isNaN(voltageMagPoint.Value) && 
                                 !isNaN(voltageAngPoint.Value);
          
          console.log('✅ Has valid frequency data:', hasValidFreq);
          console.log('✅ Has valid voltage data:', hasValidVoltage);
          console.log('✅ Would pass PMU Service filter:', hasValidFreq && hasValidVoltage);
          
          if (hasValidFreq && hasValidVoltage) {
            console.log(`🎉 ${pmuName} - SHOULD APPEAR ON MAP`);
          } else {
            console.log(`❌ ${pmuName} - WOULD BE FILTERED OUT`);
          }
        } else {
          console.log(`❌ ${pmuName} - No data points found`);
        }
      } else {
        console.log(`❌ ${pmuName} - Request failed:`, combinedResponse.statusText);
      }
    } catch (error) {
      console.error(`❌ ${pmuName} - Request error:`, error.message);
    }
  }
  
  // Now test Itaipu for comparison
  console.log('\n🔍 Testing Itaipu PMU for comparison:');
  const ITAIPU_IDS = {
    frequency: 1486,
    dfreq: 1487,
    voltageAMag: 1488,
    voltageAAng: 1489
  };
  
  const itaipuIds = `${ITAIPU_IDS.frequency},${ITAIPU_IDS.dfreq},${ITAIPU_IDS.voltageAMag},${ITAIPU_IDS.voltageAAng}`;
  const itaipuUrl = `${WEBSERVICE_BASE_URL}/historian/timeseriesdata/read/historic/${itaipuIds}/${timestamp}/${timestamp}/json`;
  console.log('📡 Itaipu URL:', itaipuUrl);
  
  try {
    const itaipuResponse = await fetch(itaipuUrl);
    console.log('📊 Itaipu Response Status:', itaipuResponse.status);
    
    if (itaipuResponse.ok) {
      const itaipuData = await itaipuResponse.json();
      
      if (itaipuData.TimeSeriesDataPoints && itaipuData.TimeSeriesDataPoints.length > 0) {
        console.log(`✅ Itaipu - Found ${itaipuData.TimeSeriesDataPoints.length} data points`);
      } else {
        console.log('❌ Itaipu - No data points found (CONFIRMED: This is why it doesn\'t appear on map)');
      }
    } else {
      console.log('❌ Itaipu - Request failed:', itaipuResponse.statusText);
    }
  } catch (error) {
    console.error('❌ Itaipu - Request error:', error.message);
  }
  
  console.log('\n🏁 PMU comparison test completed!');
  console.log('\n📋 CONCLUSION:');
  console.log('   - If other PMUs have data but Itaipu doesn\'t, then Itaipu PMU is offline/disconnected');
  console.log('   - If no PMUs have data, then there\'s a general webservice issue');
  console.log('   - PMUs only appear on map if they have BOTH frequency AND voltage data');
}

// Run the test
testWorkingPMUs().catch(console.error);