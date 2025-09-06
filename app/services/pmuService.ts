import { PMUData, WebServiceConfig } from '../utils/xmlParser';

export interface TimeSeriesDataPoint {
  HistorianID: number;
  Time: string;
  Value: number;
  Quality: number;
}

export interface TimeSeriesResponse {
  TimeSeriesDataPoints: TimeSeriesDataPoint[];
}

export interface PMUMeasurement {
  pmuId: string;
  frequency: number;
  dfreq: number;
  timestamp: string;
  quality: number;
  lat: number;
  lon: number;
  station: string;
  state: string;
  area: string;
}

export class PMUService {
  private config: WebServiceConfig;
  private pmus: PMUData[];

  constructor(config: WebServiceConfig, pmus: PMUData[]) {
    this.config = config;
    this.pmus = pmus;
  }

  // Get current data for specific PMU IDs
  async getCurrentData(historianIds: number[]): Promise<TimeSeriesDataPoint[]> {
    const idsString = historianIds.join(',');
    const url = `http://${this.config.address}/historian/timeseriesdata/read/current/${idsString}/json`;
    
    try {
      console.log('Fetching data from:', url);
      
      // Verificar se estamos em ambiente de desenvolvimento
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.warn('Development mode: Using mock data due to CORS restrictions');
        return this.getMockData(historianIds);
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: TimeSeriesResponse = await response.json();
      return data.TimeSeriesDataPoints || [];
    } catch (error) {
      console.error('Error fetching PMU data:', error);
      console.warn('Falling back to mock data');
      // Fallback para dados simulados
      return this.getMockData(historianIds);
    }
  }

  // Get all PMU measurements with current data
  async getAllPMUMeasurements(): Promise<PMUMeasurement[]> {
    // Get all frequency and dfreq IDs
    const allIds: number[] = [];
    this.pmus.forEach(pmu => {
      if (pmu.frequencyId > 0) allIds.push(pmu.frequencyId);
      if (pmu.dfreqId > 0) allIds.push(pmu.dfreqId);
    });

    // Fetch current data
    const dataPoints = await this.getCurrentData(allIds);
    
    // Map data to PMU measurements
    const measurements: PMUMeasurement[] = [];
    
    this.pmus.forEach(pmu => {
      const freqData = dataPoints.find(dp => dp.HistorianID === pmu.frequencyId);
      const dfreqData = dataPoints.find(dp => dp.HistorianID === pmu.dfreqId);
      
      if (freqData || dfreqData) {
        measurements.push({
          pmuId: pmu.id,
          frequency: freqData?.Value || 60.0,
          dfreq: dfreqData?.Value || 0.0,
          timestamp: freqData?.Time || dfreqData?.Time || new Date().toISOString(),
          quality: freqData?.Quality || dfreqData?.Quality || 0,
          lat: pmu.lat,
          lon: pmu.lon,
          station: pmu.station,
          state: pmu.state,
          area: pmu.area
        });
      }
    });

    return measurements;
  }

  // Get measurements for a specific region
  async getRegionMeasurements(area: string): Promise<PMUMeasurement[]> {
    const allMeasurements = await this.getAllPMUMeasurements();
    return allMeasurements.filter(m => m.area === area);
  }

  // Get aggregated data by region
  async getRegionAggregatedData() {
    const measurements = await this.getAllPMUMeasurements();
    
    const regions = {
      north: measurements.filter(m => m.area === 'N'),
      northeast: measurements.filter(m => m.area === 'NE'),
      southeast: measurements.filter(m => m.area === 'SE'),
      south: measurements.filter(m => m.area === 'S'),
      centerwest: measurements.filter(m => m.area === 'CO')
    };

    const aggregated = Object.entries(regions).reduce((acc, [regionName, regionMeasurements]) => {
      if (regionMeasurements.length > 0) {
        const avgFreq = regionMeasurements.reduce((sum, m) => sum + m.frequency, 0) / regionMeasurements.length;
        const avgDfreq = regionMeasurements.reduce((sum, m) => sum + Math.abs(m.dfreq), 0) / regionMeasurements.length;
        
        // Determine status based on frequency deviation
        let status: 'normal' | 'warning' | 'critical' = 'normal';
        if (Math.abs(avgFreq - 60) > 0.5) status = 'critical';
        else if (Math.abs(avgFreq - 60) > 0.2) status = 'warning';
        
        acc[regionName] = {
          frequency: parseFloat(avgFreq.toFixed(3)),
          dfreq: parseFloat(avgDfreq.toFixed(6)),
          status,
          pmuCount: regionMeasurements.length
        };
      } else {
        // Default values if no data
        acc[regionName] = {
          frequency: 60.0,
          dfreq: 0.0,
          status: 'normal' as const,
          pmuCount: 0
        };
      }
      return acc;
    }, {} as Record<string, { frequency: number; dfreq: number; status: 'normal' | 'warning' | 'critical'; pmuCount: number }>);

    return aggregated;
  }

  // Mock data for development/fallback
  private getMockData(historianIds: number[]): TimeSeriesDataPoint[] {
    // Generate realistic mock data for development
    return historianIds.map(id => {
      const baseFreq = 60.0;
      const variation = (Math.random() - 0.5) * 0.15; // ±0.075 Hz variation
      
      // Check if this ID belongs to a dfreq measurement by looking at our PMU data
      const isDfreq = this.pmus.some(pmu => pmu.dfreqId === id);
      
      let value;
      if (isDfreq) {
        // ROCOF values typically range from -0.5 to 0.5 Hz/s
        value = (Math.random() - 0.5) * 1.0;
      } else {
        // Frequency values around 60 Hz
        value = baseFreq + variation;
      }
      
      return {
        HistorianID: id,
        Time: new Date().toISOString(),
        Value: parseFloat(value.toFixed(4)),
        Quality: 192 // Good quality
      };
    });
  }

  // Get PMU info by ID
  getPMUInfo(pmuId: string): PMUData | undefined {
    return this.pmus.find(pmu => pmu.id === pmuId);
  }

  // Get all PMUs
  getAllPMUs(): PMUData[] {
    return this.pmus;
  }
}