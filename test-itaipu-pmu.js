// Test script for Itaipu PMU specifically
// Testing frequency (1486) and dfreq (1487) data availability

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

async function testItaipuPMU() {
  console.log('🔍 Testing Itaipu PMU specifically...');
  console.log('🌐 Webservice URL:', WEBSERVICE_BASE_URL);
  
  // PMU Itaipu_Ptec_Foz_do_Iguacu_PR IDs from XML
  const ITAIPU_IDS = {
    frequency: 1486,
    dfreq: 1487,
    // Voltage IDs from XML (phase A)
    voltageAMag: 1488, // modId for phase A
    voltageAAng: 1489  // angId for phase A
  };
  
  console.log('📊 Itaipu PMU IDs:', ITAIPU_IDS);
  
  // Test current time - 5 seconds (like PMU Service does)
  const now = new Date();
  const fiveSecondsAgo = new Date(now.getTime() - 5000);
  
  const timestamp = formatTimestamp(fiveSecondsAgo);
  
  console.log('⏰ Testing timestamp:', fiveSecondsAgo.toISOString(), '->', timestamp);
  
  // Test 1: Frequency data
  console.log('\n🔍 Test 1: Frequency data (ID: 1486)');
  const freqUrl = `${WEBSERVICE_BASE_URL}/historian/timeseriesdata/read/historic/1486/${timestamp}/${timestamp}/json`;
  console.log('📡 URL:', freqUrl);
  
  try {
    const freqResponse = await fetch(freqUrl);
    console.log('📊 Response Status:', freqResponse.status);
    
    if (freqResponse.ok) {
      const freqData = await freqResponse.json();
      console.log('✅ Frequency Response:', JSON.stringify(freqData, null, 2));
      
      if (freqData.TimeSeriesDataPoints && freqData.TimeSeriesDataPoints.length > 0) {
        const point = freqData.TimeSeriesDataPoints[0];
        console.log('📈 Frequency Value:', point.Value, 'Hz');
        console.log('🕐 Timestamp:', point.Time);
        console.log('🔍 Quality:', point.Quality);
      } else {
        console.log('❌ No frequency data points found');
      }
    } else {
      console.log('❌ Frequency request failed:', freqResponse.statusText);
    }
  } catch (error) {
    console.error('❌ Frequency request error:', error.message);
  }
  
  // Test 2: dfreq (ROCOF) data
  console.log('\n🔍 Test 2: dfreq/ROCOF data (ID: 1487)');
  const dfreqUrl = `${WEBSERVICE_BASE_URL}/historian/timeseriesdata/read/historic/1487/${timestamp}/${timestamp}/json`;
  console.log('📡 URL:', dfreqUrl);
  
  try {
    const dfreqResponse = await fetch(dfreqUrl);
    console.log('📊 Response Status:', dfreqResponse.status);
    
    if (dfreqResponse.ok) {
      const dfreqData = await dfreqResponse.json();
      console.log('✅ dfreq Response:', JSON.stringify(dfreqData, null, 2));
      
      if (dfreqData.TimeSeriesDataPoints && dfreqData.TimeSeriesDataPoints.length > 0) {
        const point = dfreqData.TimeSeriesDataPoints[0];
        console.log('📈 dfreq Value:', point.Value, 'Hz/s');
        console.log('🕐 Timestamp:', point.Time);
        console.log('🔍 Quality:', point.Quality);
      } else {
        console.log('❌ No dfreq data points found');
      }
    } else {
      console.log('❌ dfreq request failed:', dfreqResponse.statusText);
    }
  } catch (error) {
    console.error('❌ dfreq request error:', error.message);
  }
  
  // Test 3: Voltage data (both magnitude and angle)
  console.log('\n🔍 Test 3: Voltage data (IDs: 1488, 1489)');
  const voltageIds = '1488,1489';
  const voltageUrl = `${WEBSERVICE_BASE_URL}/historian/timeseriesdata/read/historic/${voltageIds}/${timestamp}/${timestamp}/json`;
  console.log('📡 URL:', voltageUrl);
  
  try {
    const voltageResponse = await fetch(voltageUrl);
    console.log('📊 Response Status:', voltageResponse.status);
    
    if (voltageResponse.ok) {
      const voltageData = await voltageResponse.json();
      console.log('✅ Voltage Response:', JSON.stringify(voltageData, null, 2));
      
      if (voltageData.TimeSeriesDataPoints && voltageData.TimeSeriesDataPoints.length > 0) {
        voltageData.TimeSeriesDataPoints.forEach(point => {
          if (point.HistorianID === 1488) {
            console.log('📈 Voltage Magnitude (1488):', point.Value, 'kV');
          } else if (point.HistorianID === 1489) {
            console.log('📈 Voltage Angle (1489):', point.Value, 'degrees');
          }
          console.log('🕐 Timestamp:', point.Time);
          console.log('🔍 Quality:', point.Quality);
        });
      } else {
        console.log('❌ No voltage data points found');
      }
    } else {
      console.log('❌ Voltage request failed:', voltageResponse.statusText);
    }
  } catch (error) {
    console.error('❌ Voltage request error:', error.message);
  }
  
  // Test 4: Combined request (like PMU Service does)
  console.log('\n🔍 Test 4: Combined request (all IDs together)');
  const allIds = '1486,1487,1488,1489';
  const combinedUrl = `${WEBSERVICE_BASE_URL}/historian/timeseriesdata/read/historic/${allIds}/${timestamp}/${timestamp}/json`;
  console.log('📡 URL:', combinedUrl);
  
  try {
    const combinedResponse = await fetch(combinedUrl);
    console.log('📊 Response Status:', combinedResponse.status);
    
    if (combinedResponse.ok) {
      const combinedData = await combinedResponse.json();
      console.log('✅ Combined Response:', JSON.stringify(combinedData, null, 2));
      
      if (combinedData.TimeSeriesDataPoints && combinedData.TimeSeriesDataPoints.length > 0) {
        console.log('\n📊 Analysis of combined data:');
        
        const freqPoint = combinedData.TimeSeriesDataPoints.find(p => p.HistorianID === 1486);
        const dfreqPoint = combinedData.TimeSeriesDataPoints.find(p => p.HistorianID === 1487);
        const voltageMagPoint = combinedData.TimeSeriesDataPoints.find(p => p.HistorianID === 1488);
        const voltageAngPoint = combinedData.TimeSeriesDataPoints.find(p => p.HistorianID === 1489);
        
        console.log('🔍 Frequency (1486):', freqPoint ? `${freqPoint.Value} Hz` : 'NOT FOUND');
        console.log('🔍 dfreq (1487):', dfreqPoint ? `${dfreqPoint.Value} Hz/s` : 'NOT FOUND');
        console.log('🔍 Voltage Mag (1488):', voltageMagPoint ? `${voltageMagPoint.Value} kV` : 'NOT FOUND');
        console.log('🔍 Voltage Ang (1489):', voltageAngPoint ? `${voltageAngPoint.Value}°` : 'NOT FOUND');
        
        // Check PMU Service filter conditions
        const hasValidFreq = freqPoint && freqPoint.Value > 0 && !isNaN(freqPoint.Value);
        const hasValidVoltage = voltageMagPoint && voltageAngPoint && 
                               voltageMagPoint.Value > 0 && 
                               !isNaN(voltageMagPoint.Value) && 
                               !isNaN(voltageAngPoint.Value);
        
        console.log('\n🔍 PMU Service Filter Analysis:');
        console.log('✅ Has valid frequency data:', hasValidFreq);
        console.log('✅ Has valid voltage data:', hasValidVoltage);
        console.log('✅ Would pass PMU Service filter:', hasValidFreq && hasValidVoltage);
        
        if (!hasValidFreq || !hasValidVoltage) {
          console.log('\n❌ REASON PMU IS FILTERED OUT:');
          if (!hasValidFreq) {
            console.log('  - Missing or invalid frequency data');
          }
          if (!hasValidVoltage) {
            console.log('  - Missing or invalid voltage data');
          }
        }
      } else {
        console.log('❌ No data points found in combined request');
      }
    } else {
      console.log('❌ Combined request failed:', combinedResponse.statusText);
    }
  } catch (error) {
    console.error('❌ Combined request error:', error.message);
  }
  
  console.log('\n🏁 Itaipu PMU test completed!');
}

// Run the test
testItaipuPMU().catch(console.error);