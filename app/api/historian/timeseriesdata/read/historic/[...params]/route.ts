import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ params: string[] }> }
) {
  try {
    // Extract parameters: [ids, startTime, endTime, format]
    const resolvedParams = await params;
    const routeParams = resolvedParams.params;
    const historianIds = routeParams[0]; // Comma-separated IDs
    const startTime = routeParams[1]; // Format: MM-DD-YY HH:mm:ss
    const endTime = routeParams[2]; // Format: MM-DD-YY HH:mm:ss
    const format = routeParams[3] || 'json'; // Default to json
    
    console.log('🔍 Historic API Route - Historian IDs:', historianIds);
    console.log('🔍 Historic API Route - Start Time:', startTime);
    console.log('🔍 Historic API Route - End Time:', endTime);
    console.log('🔍 Historic API Route - Format:', format);
    
    // Build the external webservice URL for historic data
    const webserviceUrl = `http://150.162.19.214:6156/historian/timeseriesdata/read/historic/${historianIds}/${startTime}/${endTime}/${format}`;
    
    console.log('🔍 Historic API Route - Fetching from:', webserviceUrl);
    
    // Make the request to the external webservice
    const response = await fetch(webserviceUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error('🔍 Historic API Route - External service error:', response.status, response.statusText);
      return NextResponse.json(
        { error: `External service error: ${response.status}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log('🔍 Historic API Route - Data received:', data);
    
    // Return the data with CORS headers
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
    
  } catch (error) {
    console.error('🔍 Historic API Route - Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}