// Debug webservice data structure

// Test configuration
const WEBSERVICE_BASE_URL = 'http://150.162.19.214:6156';

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

async function debugWebserviceData() {
  console.log('🔍 Debugging webservice data structure...');
  
  // Test current time - 5 seconds
  const now = new Date();
  const fiveSecondsAgo = new Date(now.getTime() - 5000);
  const oneSecondLater = new Date(fiveSecondsAgo.getTime() + 1000);
  
  const startTime = formatTimestamp(fiveSecondsAgo);
  const endTime = formatTimestamp(oneSecondLater);
  
  console.log('⏰ Time range:', startTime, 'to', endTime);
  
  // Test voltage data (magnitude + angle for phase A)
  const voltageUrl = `${WEBSERVICE_BASE_URL}/historian/timeseriesdata/read/historic/846,847/${startTime}/${endTime}/json`;
  
  console.log('\n🔌 Testing voltage URL:', voltageUrl);
  
  try {
    const response = await fetch(voltageUrl);
    console.log('📊 Response Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('\n📋 Full Response Structure:');
      console.log(JSON.stringify(data, null, 2));
      
      console.log('\n🔍 Analyzing structure:');
      console.log('- Root keys:', Object.keys(data));
      
      if (data.TimeSeriesDataPoints) {
        console.log('- TimeSeriesDataPoints length:', data.TimeSeriesDataPoints.length);
        
        if (data.TimeSeriesDataPoints.length > 0) {
          const firstPoint = data.TimeSeriesDataPoints[0];
          console.log('\n📈 First data point structure:');
          console.log(JSON.stringify(firstPoint, null, 2));
          
          console.log('\n🔍 First point analysis:');
          console.log('- Keys:', Object.keys(firstPoint));
          if (firstPoint.Values) {
            console.log('- Values length:', firstPoint.Values.length);
            console.log('- First value:', firstPoint.Values[0]);
            if (firstPoint.Values[1]) {
              console.log('- Second value:', firstPoint.Values[1]);
            }
          }
        }
        
        // Show last few points too
        if (data.TimeSeriesDataPoints.length > 1) {
          const lastPoint = data.TimeSeriesDataPoints[data.TimeSeriesDataPoints.length - 1];
          console.log('\n📈 Last data point:');
          console.log(JSON.stringify(lastPoint, null, 2));
        }
      }
    } else {
      console.log('❌ Request failed:', await response.text());
    }
  } catch (error) {
    console.log('💥 Request error:', error.message);
  }
  
  console.log('\n🏁 Debug completed!');
}

// Run the debug
debugWebserviceData().catch(console.error);