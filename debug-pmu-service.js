// Script para debugar o pmuService no navegador
// Execute este script no console do navegador (F12)

console.log('🔍 DEBUG: Verificando estado do pmuService...');

// Acessar o store do Zustand
const store = window.__ZUSTAND_STORE__ || {};
console.log('🔍 DEBUG: Store disponível:', !!store);

// Tentar acessar o pmuService através do window
if (window.pmuServiceDebug) {
  console.log('🔍 DEBUG: pmuService encontrado no window');
  const service = window.pmuServiceDebug;
  
  console.log('🔍 DEBUG: Forçando atualização...');
  service.forceUpdate().then(measurements => {
    console.log('📊 DEBUG: Medições recebidas:', measurements.length);
    
    // Procurar especificamente pela PMU Itaipu
    const itaipu = measurements.find(m => m.pmuName.includes('Itaipu'));
    if (itaipu) {
      console.log('✅ DEBUG: PMU Itaipu ENCONTRADA!', itaipu);
    } else {
      console.log('❌ DEBUG: PMU Itaipu NÃO encontrada');
      console.log('📋 DEBUG: PMUs disponíveis:');
      measurements.forEach((m, i) => {
        console.log(`  ${i + 1}. ${m.pmuName} (${m.frequency}Hz)`);
      });
    }
  }).catch(error => {
    console.error('❌ DEBUG: Erro ao forçar atualização:', error);
  });
} else {
  console.log('❌ DEBUG: pmuService não encontrado no window');
  console.log('🔍 DEBUG: Objetos disponíveis no window:', Object.keys(window).filter(k => k.includes('pmu') || k.includes('PMU')));
}

// Verificar se há dados no localStorage ou sessionStorage
console.log('🔍 DEBUG: Verificando storage...');
console.log('localStorage keys:', Object.keys(localStorage));
console.log('sessionStorage keys:', Object.keys(sessionStorage));

// Tentar acessar diretamente o módulo pmuService
try {
  console.log('🔍 DEBUG: Tentando importar pmuService dinamicamente...');
  import('/app/services/pmuService.js').then(module => {
    console.log('✅ DEBUG: Módulo pmuService carregado:', module);
    const service = module.PMUService.getInstance();
    if (service) {
      console.log('✅ DEBUG: Instância do pmuService obtida');
      service.forceUpdate().then(measurements => {
        console.log('📊 DEBUG: Medições do módulo:', measurements.length);
        const itaipu = measurements.find(m => m.pmuName.includes('Itaipu'));
        if (itaipu) {
          console.log('✅ DEBUG: PMU Itaipu ENCONTRADA no módulo!', itaipu);
        } else {
          console.log('❌ DEBUG: PMU Itaipu NÃO encontrada no módulo');
        }
      });
    }
  }).catch(error => {
    console.log('❌ DEBUG: Erro ao importar módulo:', error);
  });
} catch (error) {
  console.log('❌ DEBUG: Erro na importação dinâmica:', error);
}

console.log('🔍 DEBUG: Script de debug concluído. Verifique os logs acima.');