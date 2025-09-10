'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useDashboardStore } from '../stores/dashboardStore';

// Interface otimizada - componente recebe apenas dados de frequência
interface MapFrequencyData {
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
  // Propriedades derivadas para compatibilidade
  name?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  rocof?: number;
}

interface OptimizedMapProps {
  // Props mínimas necessárias - React.memo funcionará melhor
  className?: string;
}

const getStatusText = (frequency: number): string => {
  if (frequency >= 59.9 && frequency <= 60.1) return 'Normal';
  if (frequency >= 59.5 && frequency <= 60.5) return 'Atenção';
  return 'Crítico';
};

/**
 * Componente de mapa otimizado para 2025
 * Sem React.memo - dados mudam constantemente a cada 5 segundos
 */
const MapComponent = ({}: OptimizedMapProps) => {
  // Seletores otimizados - apenas re-renderiza quando dados específicos mudam
  const pmuMeasurements = useDashboardStore(state => state.pmuMeasurements);
  const isConnected = useDashboardStore(state => state.isRealDataConnected);
  const pmuService = useDashboardStore(state => state.pmuService);
  const setPmuMeasurements = useDashboardStore(state => state.setPmuMeasurements);
  
  // Estado de cliente - igual aos outros componentes
  const [isClient, setIsClient] = useState(false);
  
  // Inicializar cliente
  React.useEffect(() => {
    setIsClient(true);
  }, []);
  
  // OTIMIZAÇÃO: Carregar dados em cache imediatamente quando o mapa inicializa
  React.useEffect(() => {
    if (pmuService && pmuMeasurements.length === 0) {
      console.log('🗺️ Mapa - Carregando dados em cache do PMU Service...');
      const cachedData = pmuService.getLastMeasurements();
      if (cachedData.length > 0) {
        console.log(`🗺️ Mapa - ${cachedData.length} PMUs carregadas do cache!`);
        setPmuMeasurements(cachedData);
      } else {
        console.log('🗺️ Mapa - Nenhum dado em cache, aguardando primeira requisição...');
      }
    }
  }, [pmuService, setPmuMeasurements, pmuMeasurements.length]);

  // Memoização dos dados de frequência - APENAS dados reais
  const frequencyData = React.useMemo(() => 
    pmuMeasurements.map(pmu => ({
      ...pmu,
      name: pmu.pmuName,
      region: pmu.area,
      latitude: pmu.lat,
      longitude: pmu.lon,
      rocof: pmu.dfreq,
      // APENAS dados reais - sem fallbacks
      frequency: pmu.frequency, // Só dados reais do webservice
      displayStatus: pmu.status
    })),
    [pmuMeasurements]
  );
  
  // Estado local mínimo - apenas PMU selecionada
  const [selectedPMU, setSelectedPMU] = useState<MapFrequencyData | null>(null);
  
  // Componentes do Leaflet carregados estaticamente para melhor performance
  const [leafletComponents, setLeafletComponents] = React.useState<{
    MapContainer: React.ComponentType<React.PropsWithChildren<{ center: [number, number]; zoom: number; style: React.CSSProperties }>>;
    TileLayer: React.ComponentType<{ url: string; attribution: string }>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Marker: React.ComponentType<any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Popup: React.ComponentType<any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    CircleMarker: React.ComponentType<any>;
    L: typeof import('leaflet');
  } | null>(null);
  
  React.useEffect(() => {
    if (isClient) {
      // Carregamento imediato sem async/await
      Promise.all([
        import('leaflet'),
        import('react-leaflet')
      ]).then(([L, reactLeaflet]) => {
        const { MapContainer, TileLayer, Marker, Popup, CircleMarker } = reactLeaflet;
        
        // Configurar ícones do Leaflet
        delete (L.default as typeof L.default & { Icon: { Default: { prototype: { _getIconUrl?: unknown } } } }).Icon.Default.prototype._getIconUrl;
        L.default.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
        
        setLeafletComponents({ MapContainer, TileLayer, Marker, Popup, CircleMarker, L: L.default });
      });
    }
  }, [isClient]);

  // Atualizar PMU selecionada quando os dados são atualizados
  React.useEffect(() => {
    if (selectedPMU && frequencyData?.length > 0) {
      const updatedPMU = frequencyData.find(pmu => pmu.pmuId === selectedPMU.pmuId);
      if (updatedPMU && updatedPMU.timestamp !== selectedPMU.timestamp) {
        setSelectedPMU(updatedPMU);
      }
    }
  }, [frequencyData, selectedPMU]);

  // Função para criar ícones customizados modernos para 2025
  const createCustomIcon = (frequency: number) => {
    if (!leafletComponents?.L) return null;
    
    let color = '#10B981'; // Verde (normal)
    let glowColor = '#10b981';
    if (Math.abs(frequency - 60) > 0.5) {
      color = '#EF4444'; // Vermelho (crítico)
      glowColor = '#ef4444';
    } else if (Math.abs(frequency - 60) > 0.2) {
      color = '#F59E0B'; // Amarelo (aviso)
      glowColor = '#f59e0b';
    }
    
    return leafletComponents.L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%);
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 0 3px ${glowColor}22, 0 4px 12px rgba(0,0,0,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          cursor: pointer;
        ">
          <div style="
            width: 8px;
            height: 8px;
            background-color: white;
            border-radius: 50%;
            box-shadow: 0 0 2px rgba(0,0,0,0.2);
          "></div>
        </div>
        <style>
          .custom-marker:hover div {
            transform: scale(1.2);
            box-shadow: 0 0 0 4px ${glowColor}33, 0 6px 16px rgba(0,0,0,0.2);
          }
        </style>
      `,
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });
  };

  // DADOS OTIMIZADOS - Memoizar para evitar re-renderizações do cabeçalho
  const realMeasurements = React.useMemo(() => {
    return (frequencyData || []).filter(pmu => {
      const hasValidFreq = pmu.frequency > 0;
      const hasValidTimestamp = pmu.timestamp && pmu.timestamp !== '2024-01-01T00:00:00.000Z';
      const isConnected = pmu.status === 'connected' || pmu.status === 'active' || pmu.status === 'partial';
      
      // PMU aparece no mapa se tem dados válidos E timestamp válido E está conectada
      return (hasValidFreq || pmu.status === 'partial') && hasValidTimestamp && isConnected;
    });
  }, [frequencyData]);
  
  // Obter TODAS as PMUs do XML para mostrar círculos vermelhos das inativas APENAS quando há dados
  const allPMUsFromXML = React.useMemo(() => {
    return pmuService?.getAllPMUs() || [];
  }, [pmuService]);
  
  console.log('🗺️ RealBrazilMap - REAL DATA ONLY - No simulation allowed');
  console.log('🗺️ RealBrazilMap - Valid real measurements:', realMeasurements.length);
  console.log('🗺️ RealBrazilMap - Total frequency data received:', frequencyData?.length || 0);
  console.log('🗺️ RealBrazilMap - Total PMUs from XML:', allPMUsFromXML.length);
  console.log('🗺️ RealBrazilMap - Connection status:', isConnected);
  
  if (realMeasurements.length > 0) {
    console.log('🗺️ RealBrazilMap - Sample real measurement:', realMeasurements[0]);
  } else {
    console.log('🗺️ RealBrazilMap - ❌ NO REAL DATA AVAILABLE - Webservice disconnected');
  }
  
  // Só mostrar PMUs inativas (vermelhas) se já temos dados do webservice
  // Isso evita mostrar círculos vermelhos no carregamento inicial
  const hasWebserviceData = frequencyData.length > 0 && isConnected;
  
  // Identificar PMUs ativas e inativas APENAS se há dados do webservice - Memoizado
  const activePMUIds = React.useMemo(() => {
    return new Set(realMeasurements.map(pmu => pmu.pmuId));
  }, [realMeasurements]);
  
  // Criar lista de PMUs inativas baseada no XML completo APENAS se há dados - Memoizada
  const inactivePMUs = React.useMemo(() => {
    return hasWebserviceData ? allPMUsFromXML
      .filter(pmu => !activePMUIds.has(pmu.id)) // PMUs que não têm dados válidos
      .map(pmu => ({
        pmuId: pmu.id,
        pmuName: pmu.fullName,
        frequency: 0,
        dfreq: 0,
        timestamp: '',
        quality: 0,
        lat: pmu.lat,
        lon: pmu.lon,
        latitude: pmu.lat,
        longitude: pmu.lon,
        station: pmu.station,
        state: pmu.state,
        area: pmu.area,
        voltLevel: pmu.voltLevel,
        status: 'disconnected'
      })) : [];
  }, [hasWebserviceData, allPMUsFromXML, activePMUIds]);
  
  console.log('🗺️ RealBrazilMap - Has webservice data:', hasWebserviceData);
  console.log('🗺️ RealBrazilMap - Active PMUs (real data):', activePMUIds.size, 'Inactive PMUs (red circles):', inactivePMUs.length);
  if (inactivePMUs.length > 0) {
    console.log('🗺️ RealBrazilMap - Inactive PMUs:', inactivePMUs.map(pmu => `${pmu.pmuName} (${pmu.area})`));
    console.log('🔥 MANAUS CHECK - Looking for Manaus in inactive PMUs:', inactivePMUs.filter(pmu => pmu.pmuName.toLowerCase().includes('manaus')));
  }

  // Função para renderizar o conteúdo do mapa baseado no estado
  const renderMapContent = () => {
    // Se o Leaflet ainda não carregou ou não há PMUs, mostrar carregamento do mapa
    if (!isClient || !leafletComponents || realMeasurements.length === 0) {
      return (
        <div className="w-full h-full relative bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl border border-slate-300 overflow-hidden flex items-center justify-center">
          <div className="text-center p-8">
            <div className="text-6xl mb-4 animate-spin">🗺️</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Carregando mapa...</h3>
            <p className="text-sm text-gray-500">
              Preparando visualização do sistema elétrico
            </p>
          </div>
        </div>
      );
    }
    
    const { MapContainer, TileLayer, Marker, Popup, CircleMarker } = leafletComponents;
    
    return (
      <div className="w-full h-full">
        <MapContainer
          center={[-14.2350, -51.9253]}
          zoom={4}
          style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* PMUs ativas com dados reais */}
          {realMeasurements.map((pmu) => (
            <Marker
              key={pmu.pmuId}
              position={[pmu.latitude || pmu.lat, pmu.longitude || pmu.lon]}
              icon={createCustomIcon(pmu.frequency)}
              eventHandlers={{
                click: () => setSelectedPMU(pmu)
              }}
            >
              <Popup>
                <div className="pt-1 min-w-[200px]">
                    <h4 className="font-bold text-gray-800">{pmu.pmuName}</h4>
                    <div className="text-sm" style={{lineHeight: '1.5'}}>
                      <div><span className="font-medium">Frequência:</span> <span className={`font-bold ${
                        Math.abs(pmu.frequency - 60) <= 0.1 ? 'text-green-600' :
                        Math.abs(pmu.frequency - 60) <= 0.5 ? 'text-yellow-600' : 'text-red-600'
                      }`}>{pmu.frequency.toFixed(3)} Hz</span></div>
                      <div><span className="font-medium">ROCOF:</span> {pmu.rocof?.toFixed(3) || 'N/A'} Hz/s</div>
                      <div><span className="font-medium">Status:</span> <span className="text-green-600 font-medium">{getStatusText(pmu.frequency)}</span></div>
                      <div><span className="font-medium">Região:</span> {pmu.region || pmu.area}</div>
                      <div><span className="font-medium">Estado:</span> {pmu.state}</div>
                    </div>
                    <p className="text-xs text-gray-500">Última atualização: {new Date(pmu.timestamp).toLocaleTimeString('pt-BR')}</p>
                  </div>
              </Popup>
            </Marker>
          ))}
          
          {/* PMUs inativas (círculos vermelhos) */}
          {inactivePMUs.map((pmu) => (
            <CircleMarker
              key={`inactive-${pmu.pmuId}`}
              center={[pmu.latitude || pmu.lat, pmu.longitude || pmu.lon]}
              radius={8}
              pathOptions={{
                color: '#ef4444',
                fillColor: '#ef4444',
                fillOpacity: 0.6,
                weight: 2
              }}
            >
              <Popup>
                <div className="p-1.5 min-w-[200px]">
                    <h4 className="font-bold text-gray-800 mb-1">{pmu.pmuName}</h4>
                    <div className="text-sm" style={{lineHeight: '1.1'}}>
                      <div style={{margin: '0', padding: '0'}}><span className="font-medium">Status:</span> <span className="text-red-600 font-medium">Desconectada</span></div>
                      <div style={{margin: '0', padding: '0'}}><span className="font-medium">Região:</span> {pmu.area}</div>
                      <div style={{margin: '0', padding: '0'}}><span className="font-medium">Estado:</span> {pmu.state}</div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Sem dados disponíveis</p>
                  </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    );
  };

  // Componente memoizado para o cabeçalho - evita re-renderizações desnecessárias
  const MapHeader = React.memo(({ activePMUCount, inactivePMUCount, showStats }: {
    activePMUCount: number;
    inactivePMUCount: number;
    showStats: boolean;
  }) => (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-2 sm:space-y-0 flex-shrink-0">
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 bg-gradient-to-r from-emerald-600 to-cyan-800 rounded-full animate-pulse"></div>
        <h3 className="text-lg sm:text-xl font-bold text-gray-900">
          Mapa do Sistema Elétrico
        </h3>
        <p className="text-xs sm:text-sm text-gray-500">
          PMUs
        </p>
      </div>
      {showStats && (
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <span>PMUs Ativas: <span className="text-green-600 font-medium">{activePMUCount}</span></span>
          <span>•</span>
          <span>Inativas: <span className="text-red-500 font-medium">{inactivePMUCount}</span></span>
        </div>
      )}
    </div>
  ));
  MapHeader.displayName = 'MapHeader';

  // Estrutura principal do painel sempre presente
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2 sm:p-4 pb-4 sm:pb-6 flex flex-col" style={{height: 'calc(100% - 4rem)'}}>
      {/* Cabeçalho do painel memoizado */}
      <MapHeader 
        activePMUCount={realMeasurements.length}
        inactivePMUCount={inactivePMUs.length}
        showStats={isClient}
      />

      {/* Área do mapa */}
      <div className="flex-1 relative">
        {renderMapContent()}
      </div>
      
      {/* Informações do mapa - só aparece quando o cliente está pronto */}
      {isClient && (
        <div className="flex-shrink-0 mt-4 pt-3 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>PMUs com dados em tempo real</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>PMUs sem dados</span>
              </div>
            </div>
            <div className="text-right">
              <span>Atualização: <span className="text-green-600 font-medium">5s</span></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Exportar com dynamic para evitar problemas de SSR
export default dynamic(() => Promise.resolve(MapComponent), {
  ssr: false
});