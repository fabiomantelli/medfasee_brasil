const fs = require('fs');

console.log('=== COMPARANDO ARQUIVOS XML ===');

const appXml = fs.readFileSync('app/data.xml', 'utf8');
const publicXml = fs.readFileSync('public/data.xml', 'utf8');

console.log('app/data.xml tamanho:', appXml.length);
console.log('public/data.xml tamanho:', publicXml.length);
console.log('Arquivos são idênticos:', appXml === publicXml);

if (appXml !== publicXml) {
  console.log('\n=== DIFERENÇAS ENCONTRADAS ===');
  const appLines = appXml.split('\n');
  const publicLines = publicXml.split('\n');
  
  let diffCount = 0;
  for (let i = 0; i < Math.max(appLines.length, publicLines.length); i++) {
    if (appLines[i] !== publicLines[i]) {
      console.log(`Linha ${i+1}:`);
      console.log('  app:', appLines[i]?.substring(0, 100));
      console.log('  public:', publicLines[i]?.substring(0, 100));
      diffCount++;
      if (diffCount > 10) {
        console.log('... (mais diferenças encontradas)');
        break;
      }
    }
  }
}

console.log('\n=== VERIFICANDO PMU ITAIPU ===');
const itaipuInApp = appXml.includes('S_PR_Foz_do_Iguacu_Itaipu_Ptec');
const itaipuInPublic = publicXml.includes('S_PR_Foz_do_Iguacu_Itaipu_Ptec');
console.log('PMU Itaipu em app/data.xml:', itaipuInApp);
console.log('PMU Itaipu em public/data.xml:', itaipuInPublic);

// Verificar qual arquivo o sistema está usando
console.log('\n=== VERIFICANDO QUAL XML É CARREGADO ===');
console.log('O sistema Next.js carrega de /data.xml que aponta para public/data.xml');
console.log('Se há diferenças, o app/data.xml pode estar desatualizado');

if (itaipuInApp && !itaipuInPublic) {
  console.log('\n🚨 PROBLEMA IDENTIFICADO:');
  console.log('   PMU Itaipu existe em app/data.xml mas NÃO em public/data.xml');
  console.log('   O sistema carrega de public/data.xml, por isso a PMU não aparece!');
} else if (!itaipuInApp && itaipuInPublic) {
  console.log('\n✅ PMU Itaipu existe em public/data.xml (arquivo correto)');
} else if (itaipuInApp && itaipuInPublic) {
  console.log('\n✅ PMU Itaipu existe em ambos os arquivos');
} else {
  console.log('\n❌ PMU Itaipu NÃO existe em nenhum arquivo!');
}