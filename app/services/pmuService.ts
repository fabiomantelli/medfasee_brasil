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
  private static instance: PMUService | null = null;
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
    console.log('🚀 PMU Service - Config recebida:', config);
    console.log('🚀 PMU Service - PMUs recebidas:', pmus.length);
    console.log('🚀 PMU Service - Primeira PMU:', pmus[0]);
    console.log('🚀 PMU Service - Fazendo primeira requisição AGORA...');
    
    // Fazer primeira requisição imediatamente
    this.fetchAndNotify().then(() => {
      console.log('✅ PMU Service - Primeira requisição concluída no constructor!');
    }).catch(error => {
      console.error('❌ PMU Service - Erro na primeira requisição:', error);
    });
  }

  public static getInstance(config?: WebServiceConfig, pmus?: PMUData[]): PMUService {
    if (!PMUService.instance) {
      if (!config || !pmus) {
        throw new Error('PMU Service - Config e PMUs são obrigatórios na primeira inicialização');
      }
      console.log('🚀 PMU Service - Criando nova instância singleton');
      PMUService.instance = new PMUService(config, pmus);
    } else {
      console.log('🚀 PMU Service - Retornando instância singleton existente');
    }
    return PMUService.instance;
  }

  public static resetInstance() {
    if (PMUService.instance) {
      PMUService.instance.stop();
      PMUService.instance = null;
      console.log('🚀 PMU Service - Instância singleton resetada');
    }
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
    console.log(`🔔 PMU Service - notifyObservers called with ${measurements.length} measurements`);
    console.log(`🔔 PMU Service - ${this.observers.length} observers registered`);
    
    this.observers.forEach((callback, index) => {
      try {
        console.log(`🔔 PMU Service - Calling observer ${index + 1}/${this.observers.length}`);
        callback(measurements);
        console.log(`✅ PMU Service - Observer ${index + 1} executed successfully`);
      } catch (error) {
        console.error(`❌ PMU Service - Error in observer ${index + 1} callback:`, error);
      }
    });
  }

  private async startPolling() {
    if (this.isPolling) {
      console.log('⚠️ PMU Service - Polling already active');
      return;
    }
    
    this.isPolling = true;
    console.log('🚀 PMU Service - Starting automatic polling every 5 seconds');
    console.log(`🚀 PMU Service - Observers count: ${this.observers.length}`);
    console.log('🔍 PMU Service - Iniciando polling OTIMIZADO:');
    console.log('  ⏰ Intervalo: 5 segundos exatos');
    console.log('  📊 Dados: sempre UTC atual - 5 segundos');
    console.log('  🎯 Timestamp: dinâmico para dados mais recentes');
    
    // Initial fetch
    console.log('🚀 PMU Service - Executando primeira busca...');
    try {
      await this.fetchAndNotify();
      console.log('✅ PMU Service - Primeira busca concluída');
    } catch (error) {
      console.error('❌ PMU Service - Erro na primeira busca:', error);
    }
    
    // Set up interval - atualiza a cada 5 segundos, sempre buscando dados de UTC atual - 5s
    console.log('🚀 PMU Service - Configurando interval de 5 segundos...');
    this.pollingInterval = setInterval(async () => {
      const cycleStart = new Date();
      console.log(`\n🔄 PMU Service - NOVO CICLO iniciado em ${cycleStart.toISOString()}`);
      try {
        await this.fetchAndNotify();
        const cycleEnd = new Date();
        const cycleDuration = cycleEnd.getTime() - cycleStart.getTime();
        console.log(`✅ PMU Service - Ciclo concluído em ${cycleDuration}ms`);
      } catch (error) {
        console.error('❌ PMU Service - Erro no ciclo:', error);
      }
    }, 5000);
    console.log('✅ PMU Service - Interval configurado com sucesso');
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
      console.log(`🔍 PMU Service - Iniciando getAllPMUMeasurements...`);
      
      const measurements = await this.getAllPMUMeasurements();
      
      console.log(`✅ PMU Service - getAllPMUMeasurements concluído, retornou ${measurements.length} measurements`);
      this.lastMeasurements = measurements;
      
      const fetchEnd = new Date();
      const fetchDuration = fetchEnd.getTime() - fetchStart.getTime();
      console.log(`📊 PMU Service - ${measurements.length} PMUs processadas em ${fetchDuration}ms`);
      
      console.log(`🚨 PMU Service - ANTES DE NOTIFICAR OBSERVERS - measurements.length: ${measurements.length}`);
      this.notifyObservers(measurements);
      console.log(`🚨 PMU Service - DEPOIS DE NOTIFICAR OBSERVERS`);
    } catch (error) {
      console.error('❌ PMU Service - Erro ao buscar dados:', error);
      console.error('❌ PMU Service - Stack trace:', (error as Error).stack);
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
    
    // TIMESTAMP DINÂMICO: Sempre UTC atual - 5 segundos para dados mais recentes
    // Cada requisição usa o timestamp mais atual possível
    const now = new Date();
    const fiveSecondsAgo = new Date(now.getTime() - 5000); // 5 segundos atrás do UTC atual
    
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
    
    const currentTimestamp = formatDateTime(fiveSecondsAgo);
    console.log(`🔍 PMU Service - Buscando dados de: ${currentTimestamp} (UTC atual - 5s: ${fiveSecondsAgo.toISOString()})`);
    
    // Batch requests to avoid server overload (max 10 IDs per request)
    const BATCH_SIZE = 10;
    const batches: number[][] = [];
    
    for (let i = 0; i < historianIds.length; i += BATCH_SIZE) {
      batches.push(historianIds.slice(i, i + BATCH_SIZE));
    }
    
    console.log(`🔍 PMU Service - Splitting into ${batches.length} batches of max ${BATCH_SIZE} IDs each`);
    
    const allDataPoints: TimeSeriesDataPoint[] = [];
    
    try {
      // Process batches sequentially with delay to avoid overwhelming the server
      for (let i = 0; i < batches.length; i++) {
        console.log(`🔍 PMU Service - Processing batch ${i + 1}/${batches.length}`);
        
        const batch = batches[i];
        const idsString = batch.join(',');
        
        // Recalcular timestamp para cada batch para garantir dados mais recentes
        const batchTime = new Date();
        const batchFiveSecondsAgo = new Date(batchTime.getTime() - 5000);
        const timestamp = formatDateTime(batchFiveSecondsAgo);
        const url = `/api/historian/timeseriesdata/read/historic/${idsString}/${timestamp}/${timestamp}/json`;
        
        try {
          console.log(`🔍 PMU Service - Fetching batch ${i + 1}/${batches.length} (${batch.length} IDs):`, url);
          
          // Usar proxy local para evitar problemas de CORS
          const proxyUrl = `/api/historian/timeseriesdata/read/historic/${idsString}/${timestamp}/${timestamp}/json`;
          console.log(`🔍 PMU Service - Buscando dados de 5s atrás via proxy: ${proxyUrl}`);
          
          // Construir URL completa para evitar erro de URL inválida
          const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
          const fullUrl = new URL(proxyUrl, baseUrl).toString();
          console.log(`🔍 PMU Service - Full URL: ${fullUrl}`);
          
          // Adicionar timeout mais generoso para evitar ERR_ABORTED
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
              console.warn(`⏰ PMU Service - Timeout para batch ${i + 1} após 30 segundos`);
              controller.abort();
            }, 30000); // 30 segundos timeout
            
            const response = await fetch(fullUrl, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
              mode: 'cors',
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);

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
          if (error instanceof Error) {
            if (error.name === 'AbortError') {
              console.warn(`⏰ PMU Service - Batch ${i + 1} foi cancelado por timeout`);
            } else if (error.message.includes('Failed to fetch')) {
              console.error(`🌐 PMU Service - Erro de rede no batch ${i + 1}:`, error.message);
            } else {
              console.error(`🔍 PMU Service - Erro desconhecido no batch ${i + 1}:`, error);
            }
          } else {
            console.error(`🔍 PMU Service - Error fetching batch ${i + 1}:`, error);
          }
          // Continue with other batches even if one fails
        }
        
        console.log(`🔍 PMU Service - Current total data points: ${allDataPoints.length}`);
      }
      
      console.log(`✅ PMU Service - getCurrentData completed with ${allDataPoints.length} total data points`);
      
      // If no data was retrieved from webservice, return empty array (no mock data)
      if (allDataPoints.length === 0) {
        console.log('🔍 PMU Service - No data from webservice, returning empty array (no mock data)');
        return [];
      }
      
      return allDataPoints;
    } catch (error) {
      console.error(`❌ PMU Service - Error in getCurrentData:`, error);
      return [];
    }
  }

  // Get all PMU measurements with current data
  async getAllPMUMeasurements(): Promise<PMUMeasurement[]> {
    // Get all IDs (frequency, dfreq, and voltage phase A only)
    const allIds: number[] = [];
    this.pmus.forEach(pmu => {
      if (pmu.frequencyId > 0) allIds.push(pmu.frequencyId);
      if (pmu.dfreqId > 0) allIds.push(pmu.dfreqId);
      // Add voltage IDs ONLY for phase A (magnitude and angle)
      if (pmu.voltageIds.A.modId > 0) allIds.push(pmu.voltageIds.A.modId);
      if (pmu.voltageIds.A.angId > 0) allIds.push(pmu.voltageIds.A.angId);
      // Phases B and C removed to optimize performance - only phase A needed
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
      
      // Get voltage data for phase A only
      const voltageAMag = dataPoints.find(dp => dp.HistorianID === pmu.voltageIds.A.modId);
      const voltageAAng = dataPoints.find(dp => dp.HistorianID === pmu.voltageIds.A.angId);
      
      // Debug: Log voltage data for each PMU
      if (voltageAMag || voltageAAng) {
        console.log(`PMU ${pmu.fullName}:`);
        console.log(`  Magnitude ID ${pmu.voltageIds.A.modId}:`, voltageAMag?.Value);
        console.log(`  Angle ID ${pmu.voltageIds.A.angId}:`, voltageAAng?.Value);
      }
      // Phases B and C removed - only phase A needed for optimization
      
      // Verificar se temos dados válidos de tensão (necessário para gráficos angulares)
      const hasValidVoltageA = voltageAMag && voltageAAng && 
                              voltageAMag.Value > 0 && 
                              !isNaN(voltageAMag.Value) && 
                              !isNaN(voltageAAng.Value);
      
      // Verificar se temos dados válidos de frequência
      const hasValidFreqData = freqData && freqData.Value > 0 && !isNaN(freqData.Value);
      
      // FILTRO RIGOROSO: PMUs só são aprovadas com dados REAIS do webservice
      // Não criar dados falsos - só aceitar dados válidos recebidos do servidor
      const hasRealData = hasValidFreqData && hasValidVoltageA;
      
      if (hasRealData) {
        const freqInfo = `freq: ${freqData.Value.toFixed(3)}Hz`;
        const voltageInfo = `voltage: ${voltageAMag.Value.toFixed(1)}kV`;
        console.log(`✅ PMU ${pmu.fullName} - APROVADA (${freqInfo}, ${voltageInfo})`);
        
        // Usar APENAS dados reais do webservice - sem valores padrão
        const measurement: PMUMeasurement = {
          pmuId: pmu.id,
          pmuName: pmu.fullName,
          frequency: freqData.Value, // APENAS dados reais
          dfreq: dfreqData?.Value || 0.0,
          timestamp: freqData.Time,
          quality: freqData.Quality,
          lat: pmu.lat,
          lon: pmu.lon,
          station: pmu.station,
          state: pmu.state,
          area: pmu.area,
          voltLevel: pmu.voltLevel,
          status: 'active' // Só PMUs com dados reais são ativas
        };
        
        // Add voltage data only for phase A (phases B and C removed for optimization)
        if (hasValidVoltageA) {
          measurement.voltageA = {
            magnitude: voltageAMag.Value,
            angle: voltageAAng.Value
          };
        }
        
        measurements.push(measurement);
      } else {
        filteredCount++;
        const freqInfo = hasValidFreqData ? `freq: ${freqData.Value.toFixed(3)}Hz` : 'no freq data';
        const voltageInfo = hasValidVoltageA ? `voltage: ${voltageAMag.Value.toFixed(1)}kV` : 'no voltage data';
        console.log(`❌ PMU ${pmu.fullName} - REJEITADA - dados incompletos (${freqInfo}, ${voltageInfo})`);
      }
    });

    console.log(`🔍 PMU Service - Resultado do filtro RIGOROSO: ${measurements.length} PMUs aprovadas, ${filteredCount} PMUs rejeitadas`);
    console.log(`🔍 PMU Service - FILTRO RIGOROSO: Só aceita PMUs com dados REAIS de frequência E tensão`);
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