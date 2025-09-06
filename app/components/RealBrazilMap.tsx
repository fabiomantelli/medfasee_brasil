'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { PMUService, PMUMeasurement } from '../services/pmuService';
import { loadPMUData, PMUData } from '../utils/xmlParser';

// Interfaces para os dados do sistema
interface SystemData {
  frequency: number;
  timestamp: string;
  status: 'normal' | 'warning' | 'critical';
  regions: {
    north: { frequency: number; status: 'normal' | 'warning' | 'critical' };
    northeast: { frequency: number; status: 'normal' | 'warning' | 'critical' };
    southeast: { frequency: number; status: 'normal' | 'warning' | 'critical' };
    south: { frequency: number; status: 'normal' | 'warning' | 'critical' };
    centerwest: { frequency: number; status: 'normal' | 'warning' | 'critical' };
  };
}

interface RealBrazilMapProps {
  data: SystemData;
}

// Coordenadas das capitais das regiões do Brasil
const regionCoordinates = {
  north: { lat: -3.1190, lng: -60.0217, name: 'Norte (Manaus)' },
  northeast: { lat: -12.9714, lng: -38.5014, name: 'Nordeste (Salvador)' },
  centerwest: { lat: -15.8267, lng: -47.9218, name: 'Centro-Oeste (Brasília)' },
  southeast: { lat: -23.5505, lng: -46.6333, name: 'Sudeste (São Paulo)' },
  south: { lat: -25.4284, lng: -49.2733, name: 'Sul (Curitiba)' }
};

const getStatusColor = (frequency: number): string => {
  if (frequency >= 59.9 && frequency <= 60.1) return '#10b981'; // Verde
  if (frequency >= 59.5 && frequency <= 60.5) return '#f59e0b'; // Amarelo
  return '#ef4444'; // Vermelho
};

const getStatusText = (frequency: number): string => {
  if (frequency >= 59.9 && frequency <= 60.1) return 'Normal';
  if (frequency >= 59.5 && frequency <= 60.5) return 'Atenção';
  return 'Crítico';
};



const MapComponent = ({ data }: RealBrazilMapProps) => {
  const [pmuMeasurements, setPmuMeasurements] = useState<PMUMeasurement[]>([]);
  const [pmuService, setPmuService] = useState<PMUService | null>(null);
  const [loading, setLoading] = useState(true);

  // Importações do Leaflet dentro do componente para evitar problemas de SSR
  const { MapContainer, TileLayer, Marker, Popup } = require('react-leaflet');
  const L = require('leaflet');
  require('leaflet-defaulticon-compatibility');

  const [selectedPMU, setSelectedPMU] = useState<PMUMeasurement | null>(null);

  // Inicializar serviço PMU
  useEffect(() => {
    const initializePMUService = async () => {
      try {
        const { pmus, config } = await loadPMUData();
        const service = new PMUService(config, pmus);
        setPmuService(service);
        
        // Carregar dados iniciais
        const measurements = await service.getAllPMUMeasurements();
        setPmuMeasurements(measurements);
        setLoading(false);
      } catch (error) {
        console.error('Error initializing PMU service:', error);
        setLoading(false);
      }
    };

    initializePMUService();
  }, []);

  // Atualizar dados periodicamente
  useEffect(() => {
    if (!pmuService) return;

    const interval = setInterval(async () => {
      try {
        const measurements = await pmuService.getAllPMUMeasurements();
        setPmuMeasurements(measurements);
      } catch (error) {
        console.error('Error updating PMU data:', error);
      }
    }, 5000); // Atualizar a cada 5 segundos

    return () => clearInterval(interval);
  }, [pmuService]);

  // Atualizar PMU selecionada quando os dados são atualizados
  useEffect(() => {
    if (selectedPMU && pmuMeasurements.length > 0) {
      const updatedPMU = pmuMeasurements.find(pmu => pmu.pmuId === selectedPMU.pmuId);
      if (updatedPMU) {
        setSelectedPMU(updatedPMU);
      }
    }
  }, [pmuMeasurements, selectedPMU?.pmuId]);

  // Função para criar ícones customizados baseados no status da frequência
  const createCustomIcon = (frequency: number) => {
    let color = '#10B981'; // Verde (normal)
    if (Math.abs(frequency - 60) > 0.5) {
      color = '#EF4444'; // Vermelho (crítico)
    } else if (Math.abs(frequency - 60) > 0.2) {
      color = '#F59E0B'; // Amarelo (aviso)
    }
    
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: ${color};
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 8px;
            height: 8px;
            background-color: white;
            border-radius: 50%;
          "></div>
        </div>
      `,
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados das PMUs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <div className="h-full w-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <MapContainer
          center={[-14.2350, -51.9253]} // Centro do Brasil
          zoom={4}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {/* Marcadores para cada PMU */}
          {pmuMeasurements.map((pmu) => {
            return (
              <Marker
                key={pmu.pmuId}
                position={[pmu.lat, pmu.lon]}
                icon={createCustomIcon(pmu.frequency)}
                eventHandlers={{
                  click: () => setSelectedPMU(pmu)
                }}
              >
                <Popup>
                  <div className="p-2 min-w-[200px]">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {pmu.station}
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Estado:</span>
                        <span className="font-mono">{pmu.state}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Região:</span>
                        <span className="font-mono">{pmu.area}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Frequência:</span>
                        <span className="font-mono">{pmu.frequency.toFixed(3)} Hz</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ROCOF:</span>
                        <span className="font-mono">{pmu.dfreq.toFixed(6)} Hz/s</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Desvio:</span>
                        <span 
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            Math.abs(pmu.frequency - 60) <= 0.2 ? 'bg-green-100 text-green-800' :
                            Math.abs(pmu.frequency - 60) <= 0.5 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}
                        >
                          {(pmu.frequency - 60 > 0 ? '+' : '')}{(pmu.frequency - 60).toFixed(3)} Hz
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        <strong>Atualizado:</strong> {new Date(pmu.timestamp).toLocaleTimeString('pt-BR')}
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

// Exportar com dynamic para evitar problemas de SSR
export default dynamic(() => Promise.resolve(MapComponent), {
  ssr: false,
  loading: () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="h-96 w-full rounded-lg bg-gray-100 dark:bg-gray-700 animate-pulse flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Carregando mapa...</div>
      </div>
    </div>
  )
});