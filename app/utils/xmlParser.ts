export interface PMUData {
  id: string;
  name: string;
  fullName: string;
  voltLevel: number;
  area: string;
  state: string;
  station: string;
  lat: number;
  lon: number;
  frequencyId: number;
  dfreqId: number;
  voltageIds: {
    A: { modId: number; angId: number };
    B: { modId: number; angId: number };
    C: { modId: number; angId: number };
  };
}

export interface WebServiceConfig {
  address: string;
  user?: string;
  password?: string;
}

export class XMLParser {
  private xmlContent: string;

  constructor(xmlContent: string) {
    this.xmlContent = xmlContent;
  }

  parseWebServiceConfig(): WebServiceConfig {
    const addressMatch = this.xmlContent.match(/<address>([^<]+)<\/address>/);
    const userMatch = this.xmlContent.match(/<user>([^<]*)<\/user>/);
    const passwordMatch = this.xmlContent.match(/<pswd>([^<]*)<\/pswd>/);

    return {
      address: addressMatch ? addressMatch[1] : '',
      user: userMatch ? userMatch[1] : undefined,
      password: passwordMatch ? passwordMatch[1] : undefined
    };
  }

  parsePMUs(): PMUData[] {
    const pmuRegex = /<pmu>([\s\S]*?)<\/pmu>/g;
    const pmus: PMUData[] = [];
    let match;

    while ((match = pmuRegex.exec(this.xmlContent)) !== null) {
      const pmuContent = match[1];
      
      // Extract basic info
      const idName = this.extractValue(pmuContent, 'idName');
      const fullName = this.extractValue(pmuContent, 'fullName');
      const voltLevel = parseInt(this.extractValue(pmuContent, 'voltLevel') || '0');
      
      // Extract location
      const area = this.extractValue(pmuContent, 'area');
      const state = this.extractValue(pmuContent, 'state');
      const station = this.extractValue(pmuContent, 'station');
      const lat = parseFloat(this.extractValue(pmuContent, 'lat') || '0');
      const lon = parseFloat(this.extractValue(pmuContent, 'lon') || '0');
      
      // Extract frequency IDs
      const frequencyId = parseInt(this.extractValue(pmuContent, 'fId') || '0');
      const dfreqId = parseInt(this.extractValue(pmuContent, 'dfId') || '0');
      
      // Extract voltage phasor IDs
      const voltageIds = this.extractVoltageIds(pmuContent);
      
      if (idName && fullName) {
        pmus.push({
          id: idName,
          name: idName,
          fullName,
          voltLevel,
          area,
          state,
          station,
          lat,
          lon,
          frequencyId,
          dfreqId,
          voltageIds
        });
      }
    }

    return pmus;
  }

  private extractValue(content: string, tagName: string): string {
    const regex = new RegExp(`<${tagName}>([^<]*)<\/${tagName}>`);
    const match = content.match(regex);
    return match ? match[1].trim() : '';
  }

  private extractVoltageIds(pmuContent: string): PMUData['voltageIds'] {
    const phasorRegex = /<phasor>([\s\S]*?)<\/phasor>/g;
    const voltageIds: PMUData['voltageIds'] = {
      A: { modId: 0, angId: 0 },
      B: { modId: 0, angId: 0 },
      C: { modId: 0, angId: 0 }
    };

    let match;
    while ((match = phasorRegex.exec(pmuContent)) !== null) {
      const phasorContent = match[1];
      const phase = this.extractValue(phasorContent, 'pPhase') as 'A' | 'B' | 'C';
      const pType = this.extractValue(phasorContent, 'pType');
      
      if (pType === 'Voltage' && ['A', 'B', 'C'].includes(phase)) {
        const modId = parseInt(this.extractValue(phasorContent, 'modId') || '0');
        const angId = parseInt(this.extractValue(phasorContent, 'angId') || '0');
        voltageIds[phase] = { modId, angId };
      }
    }

    return voltageIds;
  }

  // Get all frequency IDs for batch requests
  getAllFrequencyIds(): number[] {
    const pmus = this.parsePMUs();
    const ids: number[] = [];
    
    pmus.forEach(pmu => {
      if (pmu.frequencyId > 0) ids.push(pmu.frequencyId);
      if (pmu.dfreqId > 0) ids.push(pmu.dfreqId);
    });
    
    return [...new Set(ids)]; // Remove duplicates
  }
}

// Utility function to load and parse XML
async function fetchWithRetry(url: string, retries = 3, delay = 1000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`🔍 XMLParser - Attempt ${i + 1} to fetch ${url}`);
      
      // Try multiple URL variations to handle different environments
       const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
       const urls = [
         `${baseUrl}${url}`, // Absolute URL with origin (FIRST)
         url, // Original URL
         url.startsWith('/') ? url : `/${url}` // Ensure leading slash
       ];
      
      let lastError: Error | null = null;
      for (const tryUrl of urls) {
        try {
          console.log(`🔍 XMLParser - Trying URL: ${tryUrl}`);
          const response = await fetch(tryUrl);
          if (response.ok) {
            console.log(`🔍 XMLParser - Success with URL: ${tryUrl}`);
            return response;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        } catch (urlError) {
          console.log(`🔍 XMLParser - Failed with URL ${tryUrl}:`, urlError);
          lastError = urlError;
        }
      }
      throw lastError;
    } catch (error) {
      console.warn(`🔍 XMLParser - Fetch attempt ${i + 1} failed:`, error);
      if (i === retries - 1) throw error;
      console.log(`🔍 XMLParser - Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('All fetch attempts failed');
}

export async function loadPMUData(): Promise<{ pmus: PMUData[], config: WebServiceConfig }> {
  try {
    console.log('🔍 XMLParser - Starting to load PMU data from /data.xml');
    const response = await fetchWithRetry('/data.xml');
    console.log('🔍 XMLParser - Fetch response status:', response.status);
    
    const xmlContent = await response.text();
    console.log('🔍 XMLParser - XML content length:', xmlContent.length);
    console.log('🔍 XMLParser - XML content preview:', xmlContent.substring(0, 200));
    
    const parser = new XMLParser(xmlContent);
    const pmus = parser.parsePMUs();
    const config = parser.parseWebServiceConfig();
    
    console.log('🔍 XMLParser - Parsed PMUs count:', pmus.length);
    console.log('🔍 XMLParser - Parsed config:', config);
    console.log('🔍 XMLParser - Sample PMU:', pmus[0]);
    
    return {
      pmus,
      config
    };
  } catch (error) {
    console.error('🔍 XMLParser - Error loading PMU data:', error);
    return { pmus: [], config: { address: '' } };
  }
}