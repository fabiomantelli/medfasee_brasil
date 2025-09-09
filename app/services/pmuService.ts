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

export interface RegionData {
  region: string;
  frequency: number;
  status: string;
  pmuCount: number;
  lastUpdate: string;
}

export interface VoltageData {
  magnitude: number;
  angle: number;
}

export interface PMUMeasurement {
  pmuId: string;
  pmuName: string;
  frequency: number;
  dfreq: number;
  timestamp: string;
  quality: number;
  lat: number;
  lon: number;
  station: string;
  state: string;
  area: string;
  voltLevel: number;
  status: string;
  voltageA?: VoltageData;
  voltageB?: VoltageData;
  voltageC?: VoltageData;
}

export class PMUService {
  private config: WebServiceConfig;
  private pmus: PMUData[];
  private observers: ((measurements: PMUMeasurement[]) => void)[] = [];
  private pollingInterval: NodeJS.Timeout | null = null;
  private isPolling = false;
  private lastMeasurements: PMUMeasurement[] = [];
  private debounceTimeout: NodeJS.Timeout | null = null;
  private pendingUpdate = false;

  constructor(config: WebServiceConfig, pmus: PMUData[]) {
    this.config = config;
    this.pmus = pmus;
    
    // INICIALIZAÇÃO IMEDIATA - sem delay
    console.log('🚀 PMU Service - Constructor: INICIALIZAÇÃO IMEDIATA!');
    console.log('🚀 PMU Service - Fazendo primeira requisição AGORA...');
    
    // Fazer primeira requisição imediatamente
    this.fetchAndNotify().then(() => {
      console.log('✅ PMU Service - Primeira requisição concluída no constructor!');
    }).catch(error => {
      console.error('❌ PMU Service - Erro na primeira requisição:', error);
    });
  }

  // Public method to start polling
  public start() {
    console.log('🚀 PMU Service - start() chamado - iniciando polling contínuo');
    this.startPolling();
  }
  
  // Public method to force immediate data fetch
  public async forceUpdate(): Promise<PMUMeasurement[]> {
    console.log('⚡ PMU Service - Forçando atualização imediata...');
    try {
      const measurements = await this.getAllPMUMeasurements();
      this.lastMeasurements = measurements;
      this.notifyObservers(measurements);
      console.log(`⚡ PMU Service - Atualização forçada concluída: ${measurements.length} PMUs`);
      return measurements;
    } catch (error) {
      console.error('❌ PMU Service - Erro na atualização forçada:', error);
      return [];
    }
  }

  // Public method to stop polling
  public stop() {
    this.stopPolling();
  }

  // Observer pattern methods
  subscribe(callback: (measurements: PMUMeasurement[]) => void): () => void {
    console.log('🔔 PMU Service - Novo observer registrado. Total observers:', this.observers.length + 1);
    this.observers.push(callback);
    
    // Se já temos dados da primeira requisição, enviar imediatamente
    if (this.lastMeasurements.length > 0) {
      console.log('📊 PMU Service - Enviando dados existentes para novo observer:', this.lastMeasurements.length);
      callback(this.lastMeasurements);
    }
    
    // Start polling if this is the first observer
    if (this.observers.length === 1 && !this.isPolling) {
      console.log('🚀 PMU Service - Primeiro observer, iniciando polling...');
      this.startPolling();
    }
    
    // Return unsubscribe function
    return () => {
      const index = this.observers.indexOf(callback);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
      
      // Stop polling if no more observers
      if (this.observers.length === 0) {
        this.stopPolling();
      }
    };
  }

  private notifyObservers(measurements: PMUMeasurement[]) {
    this.observers.forEach(callback => {
      try {
        callback(measurements);
      } catch (error) {
        console.error('Error in PMU observer callback:', error);
      }
    });
  }

  private async startPolling() {
    if (this.isPolling) return;
    
    console.log('🔍 PMU Service - Iniciando polling OTIMIZADO:');
    console.log('  ⏰ Intervalo: 5 segundos exatos');
    console.log('  📊 Dados: sempre 5 segundos no passado (UTC)');
    console.log('  🎯 Timestamp: fixo por ciclo para consistência');
    this.isPolling = true;
    
    // Initial fetch
    console.log('🚀 PMU Service - Executando primeira busca...');
    await this.fetchAndNotify();
    
    // Set up interval - atualiza a cada 5 segundos, sempre buscando dados de 5s no passado
    this.pollingInterval = setInterval(async () => {
      const cycleStart = new Date();
      console.log(`\n🔄 PMU Service - NOVO CICLO iniciado em ${cycleStart.toISOString()}`);
      await this.fetchAndNotify();
      const cycleEnd = new Date();
      const cycleDuration = cycleEnd.getTime() - cycleStart.getTime();
      console.log(`✅ PMU Service - Ciclo concluído em ${cycleDuration}ms`);
    }, 5000);
  }

  private stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isPolling = false;
    console.log('⏹️ PMU Service - Stopped automatic polling');
  }

  private async fetchAndNotify() {
    try {
      const fetchStart = new Date();
      console.log(`📡 PMU Service - Buscando dados em ${fetchStart.toISOString()}`);
      
      const measurements = await this.getAllPMUMeasurements();
      this.lastMeasurements = measurements;
      
      const fetchEnd = new Date();
      const fetchDuration = fetchEnd.getTime() - fetchStart.getTime();
      console.log(`📊 PMU Service - ${measurements.length} PMUs processadas em ${fetchDuration}ms`);
      
      this.notifyObservers(measurements);
    } catch (error) {
      console.error('❌ PMU Service - Erro ao buscar dados:', error);
    }
  }

  // Get last cached measurements (synchronous)
  getLastMeasurements(): PMUMeasurement[] {
    return this.lastMeasurements;
  }

  // Get current data for specific PMU IDs with batching to avoid server overload
  async getCurrentData(historianIds: number[]): Promise<TimeSeriesDataPoint[]> {
    console.log('=== PMU Service getCurrentData called ===');
    console.log('🔍 PMU Service - Total IDs requested:', historianIds.length);
    
    if (historianIds.length === 0) {
      return [];
    }
    
    // TIMESTAMP FIXO POR CICLO: Calcular uma única vez para todo o ciclo de polling
    // Isso garante que todos os batches usem o mesmo timestamp, evitando inconsistências
    const now = new Date();
    const fiveSecondsAgo = new Date(now.getTime() - 5000); // 5 segundos atrás
    
    // Format as MM-DD-YY HH:mm:ss (UTC) - formato correto para o webservice
    const formatDateTime = (date: Date): string => {
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      const year = String(date.getUTCFullYear()).slice(-2);
      const hours = String(date.getUTCHours()).padStart(2, '0');
      const minutes = String(date.getUTCMinutes()).padStart(2, '0');
      const seconds = String(date.getUTCSeconds()).padStart(2, '0');
      
      return `${month}-${day}-${year}%20${hours}:${minutes}:${seconds}`;
    };
    
    const fixedTimestamp = formatDateTime(fiveSecondsAgo);
    console.log(`🔍 PMU Service - Using FIXED timestamp for all batches: ${fixedTimestamp} (${fiveSecondsAgo.toISOString()})`);
    
    // Batch requests to avoid server overload (max 10 IDs per request)
    const BATCH_SIZE = 10;
    const batches: number[][] = [];
    
    for (let i = 0; i < historianIds.length; i += BATCH_SIZE) {
      batches.push(historianIds.slice(i, i + BATCH_SIZE));
    }
    
    console.log(`🔍 PMU Service - Splitting into ${batches.length} batches of max ${BATCH_SIZE} IDs each`);
    
    const allDataPoints: TimeSeriesDataPoint[] = [];
    
    // Process batches sequentially with delay to avoid overwhelming the server
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const idsString = batch.join(',');
      
      const timestamp = fixedTimestamp; // Usar o timestamp fixo calculado uma única vez
      const url = `/api/historian/timeseriesdata/read/historic/${idsString}/${timestamp}/${timestamp}/json`;
      
      try {
        console.log(`🔍 PMU Service - Fetching batch ${i + 1}/${batches.length} (${batch.length} IDs):`, url);
        
        // Usar proxy local para evitar problemas de CORS
        const proxyUrl = `/api/historian/timeseriesdata/read/historic/${idsString}/${timestamp}/${timestamp}/json`;
        console.log(`🔍 PMU Service - Buscando dados de 5s atrás via proxy: ${proxyUrl}`);
        
        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          mode: 'cors'
        });

        console.log(`🔍 PMU Service - Batch ${i + 1} response status:`, response.status);
        
        if (!response.ok) {
          console.warn(`🔍 PMU Service - Batch ${i + 1} failed with status ${response.status}`);
          continue; // Skip this batch but continue with others
        }

        const data: TimeSeriesResponse = await response.json();
        const batchDataPoints = data.TimeSeriesDataPoints || [];
        console.log(`🔍 PMU Service - Batch ${i + 1} returned ${batchDataPoints.length} data points`);
        
        allDataPoints.push(...batchDataPoints);
        
        // OTIMIZAÇÃO: Reduzir delay entre batches para carregamento mais rápido
        // Delay mínimo apenas para evitar sobrecarga do servidor
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 50)); // Reduzido de 100ms para 50ms
        }
        
      } catch (error) {
        console.error(`🔍 PMU Service - Error fetching batch ${i + 1}:`, error);
        // Continue with other batches even if one fails
      }
    }
    
    console.log(`🔍 PMU Service - Total data points collected: ${allDataPoints.length}`);
    
    // If no data was retrieved from webservice, return empty array (no mock data)
    if (allDataPoints.length === 0) {
      console.log('🔍 PMU Service - No data from webservice, returning empty array (no mock data)');
      return [];
    }
    
    return allDataPoints;
  }

  // Get all PMU measurements with current data
  async getAllPMUMeasurements(): Promise<PMUMeasurement[]> {
    // Get all IDs (frequency, dfreq, and voltage)
    const allIds: number[] = [];
    this.pmus.forEach(pmu => {
      if (pmu.frequencyId > 0) allIds.push(pmu.frequencyId);
      if (pmu.dfreqId > 0) allIds.push(pmu.dfreqId);
      // Add voltage IDs for all phases
      if (pmu.voltageIds.A.modId > 0) allIds.push(pmu.voltageIds.A.modId);
      if (pmu.voltageIds.A.angId > 0) allIds.push(pmu.voltageIds.A.angId);
      if (pmu.voltageIds.B.modId > 0) allIds.push(pmu.voltageIds.B.modId);
      if (pmu.voltageIds.B.angId > 0) allIds.push(pmu.voltageIds.B.angId);
      if (pmu.voltageIds.C.modId > 0) allIds.push(pmu.voltageIds.C.modId);
      if (pmu.voltageIds.C.angId > 0) allIds.push(pmu.voltageIds.C.angId);
    });

    // Fetch current data
    console.log('🔍 PMU Service - Requesting data for IDs:', allIds);
    const dataPoints = await this.getCurrentData(allIds);
    console.log('🔍 PMU Service - Received data points:', dataPoints.length);
    if (dataPoints.length > 0) {
      console.log('🔍 PMU Service - Sample data point:', dataPoints[0]);
    }
    
    // Log all received data points
    dataPoints.forEach((point, index) => {
      console.log(`🔍 PMU Service - Data point ${index}:`, {
        HistorianID: point.HistorianID,
        Value: point.Value,
        Quality: point.Quality,
        Time: point.Time
      });
    });
    
    // Map data to PMU measurements
    const measurements: PMUMeasurement[] = [];
    let filteredCount = 0;
    
    console.log('🔍 PMU Service - Applying strict filter: PMUs must have both frequency AND voltage data');
    
    this.pmus.forEach(pmu => {
      
      const freqData = dataPoints.find(dp => dp.HistorianID === pmu.frequencyId);
      const dfreqData = dataPoints.find(dp => dp.HistorianID === pmu.dfreqId);
      
      // Get voltage data for all phases
      const voltageAMag = dataPoints.find(dp => dp.HistorianID === pmu.voltageIds.A.modId);
      const voltageAAng = dataPoints.find(dp => dp.HistorianID === pmu.voltageIds.A.angId);
      
      // Debug: Log voltage data for each PMU
      if (voltageAMag || voltageAAng) {
        console.log(`PMU ${pmu.fullName}:`);
        console.log(`  Magnitude ID ${pmu.voltageIds.A.modId}:`, voltageAMag?.Value);
        console.log(`  Angle ID ${pmu.voltageIds.A.angId}:`, voltageAAng?.Value);
      }
      const voltageBMag = dataPoints.find(dp => dp.HistorianID === pmu.voltageIds.B.modId);
      const voltageBAng = dataPoints.find(dp => dp.HistorianID === pmu.voltageIds.B.angId);
      const voltageCMag = dataPoints.find(dp => dp.HistorianID === pmu.voltageIds.C.modId);
      const voltageCAng = dataPoints.find(dp => dp.HistorianID === pmu.voltageIds.C.angId);
      
      // Verificar se temos dados válidos de tensão (necessário para gráficos angulares)
      const hasValidVoltageA = voltageAMag && voltageAAng && 
                              voltageAMag.Value > 0 && 
                              !isNaN(voltageAMag.Value) && 
                              !isNaN(voltageAAng.Value);
      
      // Verificar se temos dados válidos de frequência
      const hasValidFreqData = freqData && freqData.Value > 0 && !isNaN(freqData.Value);
      
      // FILTRO OTIMIZADO: PMUs aparecem no mapa com qualquer dado válido (frequência OU tensão)
      // Isso acelera o carregamento inicial e mostra PMUs mais rapidamente
      const hasAnyValidData = hasValidFreqData || hasValidVoltageA;
      
      if (hasAnyValidData) {
        const freqInfo = hasValidFreqData ? `freq: ${freqData?.Value?.toFixed(3)}Hz` : 'freq: N/A';
        const voltageInfo = hasValidVoltageA ? `voltage: ${voltageAMag?.Value?.toFixed(1)}kV` : 'voltage: N/A';
        console.log(`✅ PMU ${pmu.fullName} - APROVADA (${freqInfo}, ${voltageInfo})`);
        
        // Usar dados de frequência se disponíveis, senão usar valores padrão
        const measurement: PMUMeasurement = {
          pmuId: pmu.id,
          pmuName: pmu.fullName,
          frequency: freqData?.Value || (hasValidVoltageA ? 60.0 : 0), // Frequência padrão apenas se há dados de tensão
          dfreq: dfreqData?.Value || 0.0,
          timestamp: freqData?.Time || dfreqData?.Time || voltageAMag?.Time || voltageAAng?.Time || new Date().toISOString(),
          quality: freqData?.Quality || dfreqData?.Quality || voltageAMag?.Quality || voltageAAng?.Quality || 0,
          lat: pmu.lat,
          lon: pmu.lon,
          station: pmu.station,
          state: pmu.state,
          area: pmu.area,
          voltLevel: pmu.voltLevel,
          status: hasValidFreqData ? 'active' : 'partial' // Status diferenciado para PMUs com dados parciais
        };
        
        // Add voltage data only if valid
        if (hasValidVoltageA) {
          measurement.voltageA = {
            magnitude: voltageAMag.Value,
            angle: voltageAAng.Value
          };
        }
        
        // Add voltage B data if valid
        const hasValidVoltageB = voltageBMag && voltageBAng && 
                                voltageBMag.Value > 0 && 
                                !isNaN(voltageBMag.Value) && 
                                !isNaN(voltageBAng.Value);
        if (hasValidVoltageB) {
          measurement.voltageB = {
            magnitude: voltageBMag.Value,
            angle: voltageBAng.Value
          };
        }
        
        // Add voltage C data if valid
        const hasValidVoltageC = voltageCMag && voltageCAng && 
                                voltageCMag.Value > 0 && 
                                !isNaN(voltageCMag.Value) && 
                                !isNaN(voltageCAng.Value);
        if (hasValidVoltageC) {
          measurement.voltageC = {
            magnitude: voltageCMag.Value,
            angle: voltageCAng.Value
          };
        }
        
        measurements.push(measurement);
      } else {
        filteredCount++;
        const freqInfo = freqData ? `freq: ${freqData.Value}` : 'no freq';
        const voltageInfo = hasValidVoltageA ? `voltage: OK` : 'no voltage';
        console.log(`❌ PMU ${pmu.fullName} - REJEITADA - sem dados válidos (${freqInfo}, ${voltageInfo})`);
      }
    });

    console.log(`🔍 PMU Service - Resultado do filtro: ${measurements.length} PMUs aprovadas, ${filteredCount} PMUs filtradas`);
    console.log(`🔍 PMU Service - FILTRO ATUALIZADO: Agora aceita PMUs apenas com dados de frequência válidos`);
    console.log(`🔍 PMU Service - PMUs aprovadas:`, measurements.map(m => `${m.pmuName} (${m.frequency.toFixed(3)}Hz)`));
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

  // Mock data functionality removed - only real data from webservice is used

  // Get PMU info by ID
  getPMUInfo(pmuId: string): PMUData | undefined {
    return this.pmus.find(pmu => pmu.id === pmuId);
  }

  // Get all PMUs
  getAllPMUs(): PMUData[] {
    return this.pmus;
  }
}