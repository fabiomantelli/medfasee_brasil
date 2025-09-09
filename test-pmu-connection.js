// Test PMU Service connection with real webservice data
// Using native fetch (Node.js 18+)

// Test configuration
const WEBSERVICE_BASE_URL = 'http://150.162.19.214:6156';
const PMU_IDS = {
  'N_AP_Macapa_UNIFAP': {
    modIds: [846, 848, 850], // Voltage A, B, C magnitude
    angIds: [847, 849, 851], // Voltage A, B, C angle
    freqId: 843,             // Frequency
    dfreqId: 844             // ROCOF
  }
};

// Format timestamp like PMU Service does
function formatTimestamp(date) {
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const year = String(date.getUTCFullYear()).slice(-2);
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  
  return `${month}-${day}-${year}%20${hours}:${minutes}:${seconds}`;
}

async function testPMUConnection() {
  console.log('🔍 Testing PMU Service connection with real webservice...');
  console.log('🌐 Webservice URL:', WEBSERVICE_BASE_URL);
  
  // Test current time - 5 seconds (like PMU Service does)
  const now = new Date();
  const fiveSecondsAgo = new Date(now.getTime() - 5000);
  const oneSecondLater = new Date(fiveSecondsAgo.getTime() + 1000);
  
  const startTime = formatTimestamp(fiveSecondsAgo);
  const endTime = formatTimestamp(oneSecondLater);
  
  console.log('⏰ Time range:');
  console.log('  Start:', fiveSecondsAgo.toISOString(), '->', startTime);
  console.log('  End:', oneSecondLater.toISOString(), '->', endTime);
  
  // Test each PMU
  for (const [pmuName, ids] of Object.entries(PMU_IDS)) {
    console.log(`\n📡 Testing PMU: ${pmuName}`);
    
    // Test voltage measurements (magnitude + angle)
    const voltageIds = `${ids.modIds[0]},${ids.angIds[0]}`; // Just phase A for test
    const voltageUrl = `${WEBSERVICE_BASE_URL}/historian/timeseriesdata/read/historic/${voltageIds}/${startTime}/${endTime}/json`;
    
    console.log('🔌 Voltage URL:', voltageUrl);
    
    try {
      const voltageResponse = await fetch(voltageUrl);
      console.log('📊 Voltage Response Status:', voltageResponse.status);
      
      if (voltageResponse.ok) {
        const voltageData = await voltageResponse.json();
        console.log('✅ Voltage Data Points:', voltageData.TimeSeriesDataPoints?.length || 0);
        
        if (voltageData.TimeSeriesDataPoints && voltageData.TimeSeriesDataPoints.length > 0) {
          const sample = voltageData.TimeSeriesDataPoints[0];
          console.log('📈 Sample Voltage Data:', {
            timestamp: sample.Timestamp,
            magnitude: sample.Values?.[0]?.Value,
            angle: sample.Values?.[1]?.Value
          });
        }
      } else {
        console.log('❌ Voltage request failed:', await voltageResponse.text());
      }
    } catch (error) {
      console.log('💥 Voltage request error:', error.message);
    }
    
    // Test frequency measurement
    const freqUrl = `${WEBSERVICE_BASE_URL}/historian/timeseriesdata/read/historic/${ids.freqId}/${startTime}/${endTime}/json`;
    
    console.log('📊 Frequency URL:', freqUrl);
    
    try {
      const freqResponse = await fetch(freqUrl);
      console.log('📊 Frequency Response Status:', freqResponse.status);
      
      if (freqResponse.ok) {
        const freqData = await freqResponse.json();
        console.log('✅ Frequency Data Points:', freqData.TimeSeriesDataPoints?.length || 0);
        
        if (freqData.TimeSeriesDataPoints && freqData.TimeSeriesDataPoints.length > 0) {
          const sample = freqData.TimeSeriesDataPoints[0];
          console.log('📈 Sample Frequency Data:', {
            timestamp: sample.Timestamp,
            frequency: sample.Values?.[0]?.Value
          });
        }
      } else {
        console.log('❌ Frequency request failed:', await freqResponse.text());
      }
    } catch (error) {
      console.log('💥 Frequency request error:', error.message);
    }
  }
  
  console.log('\n🏁 PMU connection test completed!');
}

// Run the test
testPMUConnection().catch(console.error);