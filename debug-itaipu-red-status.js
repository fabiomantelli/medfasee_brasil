// Script para debugar por que a PMU Itaipu aparece vermelha no mapa
const fs = require('fs');

async function debugItaipuRedStatus() {
    console.log('=== DEBUG: Por que PMU Itaipu está vermelha? ===\n');
    
    try {
        // 1. Carregar XML e encontrar PMU Itaipu
        const xmlContent = fs.readFileSync('./public/data.xml', 'utf8');
        
        // Buscar PMU Itaipu usando regex
        const itaipuMatch = xmlContent.match(/<pmu[\s\S]*?<idName>S_PR_Foz_do_Iguacu_Itaipu_Ptec<\/idName>[\s\S]*?<\/pmu>/);
        
        if (itaipuMatch) {
            console.log('✅ PMU Itaipu encontrada no XML:');
            console.log('   ID: S_PR_Foz_do_Iguacu_Itaipu_Ptec');
            console.log('   Nome: Itaipu_Ptec_Foz_do_Iguacu_PR');
        } else {
            console.log('❌ PMU Itaipu não encontrada no XML!');
            return;
        }
        
        // 2. IDs conhecidos da PMU Itaipu (confirmados pelo usuário)
        const freqIds = []; // Itaipu não tem frequência no XML atual
        const voltIds = ['1503', '1504']; // IDs de tensão confirmados
        
        console.log('📊 Frequência IDs: Nenhum encontrado no XML');
        console.log('⚡ Tensão IDs: 1503 (mag), 1504 (ang) - CONFIRMADOS pelo usuário');
        
        // Buscar também IDs 1509, 1510 (segunda fase)
        const voltIds2 = ['1509', '1510'];
        console.log('⚡ Tensão IDs Fase B: 1509 (mag), 1510 (ang)');
        
        console.log(`\n🔍 Total IDs para teste: Freq=${freqIds.length}, Volt=${voltIds.length + voltIds2.length}`);
        
        // 3. Testar dados atuais (último minuto)
        const now = new Date();
        const oneMinuteAgo = new Date(now.getTime() - 60000);
        
        const formatDate = (date) => {
            const year = date.getFullYear().toString().slice(-2);
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            return `${month}-${day}-${year}%20${hours}:${minutes}:${seconds}`;
        };
        
        const startTime = formatDate(oneMinuteAgo);
        const endTime = formatDate(now);
        
        console.log(`\n⏰ Testando período: ${startTime} até ${endTime}`);
        
        // 4. Testar possível frequência (tentar IDs comuns)
        console.log(`\n🔍 TESTANDO POSSÍVEL FREQUÊNCIA...`);
        const possibleFreqIds = ['1486', '1487', '1488']; // IDs comuns de frequência
        
        for (const freqId of possibleFreqIds) {
            const freqUrl = `http://150.162.19.214:6156/historian/timeseriesdata/read/historic/${freqId}/${startTime}/${endTime}/json`;
            
            try {
                const freqResponse = await fetch(freqUrl);
                if (freqResponse.ok) {
                    const freqData = await freqResponse.json();
                    if (freqData.length > 0) {
                        console.log(`   📊 ID ${freqId}: ${freqData.length} pontos de frequência`);
                        const lastFreq = freqData[freqData.length - 1];
                        console.log(`      Último: ${lastFreq.Value} Hz (${lastFreq.Time})`);
                    }
                }
            } catch (error) {
                // Ignorar erros para IDs que não existem
            }
        }
        
        // 5. Testar tensão Fase A (1503, 1504)
        console.log(`\n⚡ TESTANDO TENSÃO FASE A (1503, 1504)...`);
        const voltUrlA = `http://150.162.19.214:6156/historian/timeseriesdata/read/historic/${voltIds.join(',')}/${startTime}/${endTime}/json`;
        console.log(`🔗 URL: ${voltUrlA}`);
        
        try {
            const voltResponseA = await fetch(voltUrlA);
            console.log(`📡 Status: ${voltResponseA.status}`);
            
            if (voltResponseA.ok) {
                const voltDataA = await voltResponseA.json();
                console.log(`📊 Total pontos: ${voltDataA.TimeSeriesDataPoints ? voltDataA.TimeSeriesDataPoints.length : 0}`);
                
                if (voltDataA.TimeSeriesDataPoints && voltDataA.TimeSeriesDataPoints.length > 0) {
                    const magData = voltDataA.TimeSeriesDataPoints.filter(d => d.HistorianID === 1503);
                    const angData = voltDataA.TimeSeriesDataPoints.filter(d => d.HistorianID === 1504);
                    
                    console.log(`   Magnitude (1503): ${magData.length} pontos`);
                    console.log(`   Ângulo (1504): ${angData.length} pontos`);
                    
                    if (magData.length > 0 && angData.length > 0) {
                        const lastMag = magData[magData.length - 1];
                        const lastAng = angData[angData.length - 1];
                        console.log(`   Último Mag: ${lastMag.Value} V (${lastMag.Time})`);
                        console.log(`   Último Ang: ${lastAng.Value}° (${lastAng.Time})`);
                        console.log(`   ✅ TENSÃO FASE A: TEM DADOS VÁLIDOS`);
                    } else {
                        console.log(`   ❌ TENSÃO FASE A: DADOS INCOMPLETOS`);
                    }
                } else {
                    console.log(`   ❌ TENSÃO FASE A: SEM DADOS`);
                }
            } else {
                console.log(`   ❌ TENSÃO FASE A: ERRO HTTP ${voltResponseA.status}`);
            }
        } catch (error) {
            console.log(`   ❌ TENSÃO FASE A: ERRO - ${error.message}`);
        }
        
        // 6. Testar tensão Fase B (1509, 1510)
        console.log(`\n⚡ TESTANDO TENSÃO FASE B (1509, 1510)...`);
        const voltUrlB = `http://150.162.19.214:6156/historian/timeseriesdata/read/historic/${voltIds2.join(',')}/${startTime}/${endTime}/json`;
        console.log(`🔗 URL: ${voltUrlB}`);
        
        try {
            const voltResponseB = await fetch(voltUrlB);
            console.log(`📡 Status: ${voltResponseB.status}`);
            
            if (voltResponseB.ok) {
                const voltDataB = await voltResponseB.json();
                console.log(`📊 Total pontos: ${voltDataB.TimeSeriesDataPoints ? voltDataB.TimeSeriesDataPoints.length : 0}`);
                
                if (voltDataB.TimeSeriesDataPoints && voltDataB.TimeSeriesDataPoints.length > 0) {
                    const magDataB = voltDataB.TimeSeriesDataPoints.filter(d => d.HistorianID === 1509);
                    const angDataB = voltDataB.TimeSeriesDataPoints.filter(d => d.HistorianID === 1510);
                    
                    console.log(`   Magnitude (1509): ${magDataB.length} pontos`);
                    console.log(`   Ângulo (1510): ${angDataB.length} pontos`);
                    
                    if (magDataB.length > 0 && angDataB.length > 0) {
                        const lastMagB = magDataB[magDataB.length - 1];
                        const lastAngB = angDataB[angDataB.length - 1];
                        console.log(`   Último Mag: ${lastMagB.Value} V (${lastMagB.Time})`);
                        console.log(`   Último Ang: ${lastAngB.Value}° (${lastAngB.Time})`);
                        console.log(`   ✅ TENSÃO FASE B: TEM DADOS VÁLIDOS`);
                    } else {
                        console.log(`   ❌ TENSÃO FASE B: DADOS INCOMPLETOS`);
                    }
                } else {
                    console.log(`   ❌ TENSÃO FASE B: SEM DADOS`);
                }
            } else {
                console.log(`   ❌ TENSÃO FASE B: ERRO HTTP ${voltResponseB.status}`);
            }
        } catch (error) {
            console.log(`   ❌ TENSÃO FASE B: ERRO - ${error.message}`);
        }
        
        // 7. Testar PMU de referência (Curitiba - ID conhecido: 1486)
        console.log(`\n\n🔄 COMPARANDO COM PMU CURITIBA (ID 1486)...`);
        
        const curitibaUrl = `http://150.162.19.214:6156/historian/timeseriesdata/read/historic/1486/${startTime}/${endTime}/json`;
        console.log(`🔗 URL Curitiba: ${curitibaUrl}`);
        
        try {
            const curitibaResponse = await fetch(curitibaUrl);
            console.log(`📡 Status Curitiba: ${curitibaResponse.status}`);
            
            if (curitibaResponse.ok) {
                const curitibaData = await curitibaResponse.json();
                console.log(`📊 Curitiba tem ${curitibaData.length} pontos de frequência`);
                
                if (curitibaData.length > 0) {
                    const lastCuritiba = curitibaData[curitibaData.length - 1];
                    console.log(`   Último valor: ${lastCuritiba.value} Hz (${lastCuritiba.timestamp})`);
                    console.log(`   ✅ CURITIBA: ATIVA (tem dados)`);
                } else {
                    console.log(`   ❌ CURITIBA: INATIVA (sem dados)`);
                }
            } else {
                console.log(`   ❌ CURITIBA: ERRO HTTP ${curitibaResponse.status}`);
            }
        } catch (error) {
            console.log(`   ❌ CURITIBA: ERRO - ${error.message}`);
        }
        
        console.log(`\n\n🎯 CONCLUSÃO:`);
        console.log(`Se Itaipu tem dados mas aparece vermelha, pode ser:`);
        console.log(`1. ⏱️  Timing: Sistema verifica em momento sem dados`);
        console.log(`2. 🔄 Cache: Dados antigos em cache do navegador`);
        console.log(`3. 🎛️  Filtros: Lógica muito restritiva no pmuService`);
        console.log(`4. 🐛 Bug: Problema específico com esta PMU`);
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

// Executar
debugItaipuRedStatus();