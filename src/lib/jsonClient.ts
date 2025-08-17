import { Oil, Recipe, RecipesRoot } from './schemas';

const API_BASE = import.meta.env.DEV ? 'http://localhost:3001/api' : '/api';
const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_WRITE_TOKEN;

const headers = {
  'Content-Type': 'application/json',
  ...(ADMIN_TOKEN && { 'x-admin-token': ADMIN_TOKEN })
};

// Coercion functions
export function coerceIncomingOils(raw: unknown): Oil[] {
  const arr = Array.isArray(raw) ? raw : (Array.isArray((raw as any)?.oils) ? (raw as any).oils : []);
  return arr.map((item: any) => ({
    id: item.id || `oil-${Date.now()}-${Math.random()}`,
    tipo_produto: item.tipo_produto || 'essential_oil',
    nome_pt: item.nome_pt || '',
    nome_latim: item.nome_latim || null,
    categoria: item.categoria || null,
    familia_botanica: item.familia_botanica || null,
    familia_olfativa: item.familia_olfativa || item.familia_olfativa_raw || null,
    familia_olfativa_raw: item.familia_olfativa_raw || null,
    parte_usada: item.parte_usada || item.parte_usada_raw || null,
    metodo_extracao: item.metodo_extracao || item.metodo_extracao_raw || null,
    metodo_extracao_raw: item.metodo_extracao_raw || null,
    principais_constituintes: Array.isArray(item.principais_constituintes) ? item.principais_constituintes : [],
    efeitos_esperados: Array.isArray(item.efeitos_esperados) ? item.efeitos_esperados : [],
    aplicacoes_sugeridas: Array.isArray(item.aplicacoes_sugeridas) ? item.aplicacoes_sugeridas : [],
    veiculos_recomendados: Array.isArray(item.veiculos_recomendados) ? item.veiculos_recomendados : [],
    propriedades_tradicionais: item.propriedades_tradicionais || null,
    etnobotanica_geral: item.etnobotanica_geral || null,
    precaucoes: item.precaucoes || null,
    contraindicacoes: item.contraindicacoes || null,
    notas_rapidas_seguranca: item.notas_rapidas_seguranca || null,
    uso_pele_sensivel: item.uso_pele_sensivel || null,
    uso_ambiente_clinico: item.uso_ambiente_clinico || null,
    uso_couro_cabeludo: item.uso_couro_cabeludo || null,
    fototoxico: item.fototoxico || null,
    sensibilizante: item.sensibilizante || null,
    alto_teor_cetonas: item.alto_teor_cetonas || null,
    alto_1_8_cineole: item.alto_1_8_cineole || null,
    alto_fenois: item.alto_fenois || null,
    publicos_restritos: item.publicos_restritos || null,
    diluicoes: item.diluicoes || null,
    sinergias_sugeridas: Array.isArray(item.sinergias_sugeridas) ? item.sinergias_sugeridas : [],
    incompatibilidades_praticas: Array.isArray(item.incompatibilidades_praticas) ? item.incompatibilidades_praticas : [],
    fontes: Array.isArray(item.fontes) ? item.fontes : [],
    regiao_origem: item.regiao_origem || null
  }));
}

// Merge functions
export function mergeOils(base: Oil[], incoming: Oil[]) {
  const map = new Map<string, Oil>();
  base.forEach(it => map.set(it.id, it));
  let added = 0, updated = 0;
  
  incoming.forEach(item => {
    if (map.has(item.id)) { 
      updated++; 
    } else { 
      added++; 
    }
    map.set(item.id, item); // upsert substitui o objeto inteiro
  });
  
  return { 
    merged: Array.from(map.values()), 
    summary: { added, updated, kept: base.length - updated } 
  };
}

export function coerceIncomingRecipes(payload: unknown): { recipes: Recipe[], version?: string, source_notice?: string } {
  // Aceitar {recipes: [...] } ou [...]
  if (Array.isArray(payload)) {
    return { recipes: payload as Recipe[] };
  }
  const root = payload as any;
  return { 
    recipes: root.recipes || [], 
    version: root.version, 
    source_notice: root.source_notice 
  };
}

export function mergeRecipes(baseRoot: RecipesRoot, incomingPayload: unknown) {
  const { recipes: incoming } = coerceIncomingRecipes(incomingPayload);
  const map = new Map<string, Recipe>();
  baseRoot.recipes.forEach(r => map.set(r.id, r));
  
  let added = 0, updated = 0;
  incoming.forEach(rec => {
    if (map.has(rec.id)) { 
      updated++; 
    } else { 
      added++; 
    }
    map.set(rec.id, rec);
  });
  
  const mergedRoot: RecipesRoot = {
    version: baseRoot.version,
    source_notice: baseRoot.source_notice,
    updated_at: new Date().toISOString(),
    recipes: Array.from(map.values())
  };
  
  return { 
    mergedRoot, 
    summary: { added, updated, kept: baseRoot.recipes.length - updated } 
  };
}

export async function getOils(): Promise<Oil[]> {
  console.log('🔄 Carregando óleos...');
  
  // Primeiro tenta via API
  try {
    console.log('🌐 Tentando carregar via API');
    const response = await fetch(`${API_BASE}/data/oils`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Óleos carregados via API:', data?.length || 0);
      return Array.isArray(data) ? data : [];
    }
  } catch (error) {
    console.log('⚠️ API não disponível, tentando arquivo oficial');
  }

  // Fallback para arquivo oficial
  try {
    console.log('📁 Tentando carregar de /data/oils_catalog.json');
    const response = await fetch('/data/oils_catalog.json');
    if (response.ok) {
      const rawData = await response.json();
      console.log('📊 Dados brutos carregados:', rawData?.length || 0);
      
      // Usar função de coerção reutilizável
      const mappedData = coerceIncomingOils(rawData);
      
      console.log('✅ Óleos mapeados:', mappedData.length);
      return mappedData;
    }
  } catch (error) {
    console.log('⚠️ Arquivo oils_catalog.json não encontrado');
  }
  
  // Retorna array vazio se nenhuma fonte funcionar
  console.log('📝 Retornando array vazio - nenhuma fonte disponível');
  return [];
}

export async function putOils(oils: Oil[]): Promise<void> {
  console.log('💾 Tentando salvar óleos:', oils.length);
  
  try {
    const response = await fetch(`${API_BASE}/data/oils`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(oils)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao salvar óleos');
    }
    
    console.log('✅ Óleos salvos via API');
  } catch (error) {
    console.log('⚠️ API não disponível, oferecendo download');
    // Em ambiente estático, oferece download do arquivo
    const timestamp = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
    downloadJson(oils, `oils_catalog_backup_${timestamp}.json`);
    throw new Error('API não disponível. Arquivo baixado para substituição manual.');
  }
}

export async function getRecipes(): Promise<RecipesRoot> {
  console.log('🔄 Carregando receitas...');
  
  // Primeiro tenta via API
  try {
    console.log('🌐 Tentando carregar via API');
    const response = await fetch(`${API_BASE}/data/recipes`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Receitas carregadas via API:', data.recipes?.length || 0);
      return data;
    }
  } catch (error) {
    console.log('⚠️ API não disponível, tentando arquivo oficial');
  }

  // Fallback para arquivo oficial
  try {
    console.log('📁 Tentando carregar de /data/recipes_catalog.json');
    const response = await fetch('/data/recipes_catalog.json');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Receitas carregadas do arquivo oficial:', data?.recipes?.length || 0);
      return data;
    }
  } catch (error) {
    console.log('⚠️ Arquivo recipes_catalog.json não encontrado');
  }

  console.log('📝 Retornando estrutura vazia - nenhuma fonte disponível');
  return {
    version: "1.0",
    updated_at: new Date().toISOString(),
    source_notice: "Arquivo não encontrado",
    recipes: []
  };
}

export async function putRecipes(recipesRoot: RecipesRoot): Promise<void> {
  console.log('💾 Tentando salvar receitas:', recipesRoot.recipes.length);
  
  try {
    const response = await fetch(`${API_BASE}/data/recipes`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(recipesRoot)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao salvar receitas');
    }
    
    console.log('✅ Receitas salvas via API');
  } catch (error) {
    console.log('⚠️ API não disponível, oferecendo download');
    // Em ambiente estático, oferece download do arquivo
    const updatedRoot = {
      ...recipesRoot,
      updated_at: new Date().toISOString()
    };
    const timestamp = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
    downloadJson(updatedRoot, `recipes_catalog_backup_${timestamp}.json`);
    throw new Error('API não disponível. Arquivo baixado para substituição manual.');
  }
}

// Export functions
export async function exportOils(fileName?: string): Promise<void> {
  console.log('📤 Exportando óleos...');
  const oils = await getOils();
  const finalFileName = fileName || 'oils_catalog.json';
  downloadJson(oils, finalFileName);
}

export async function exportRecipes(fileName?: string): Promise<void> {
  console.log('📤 Exportando receitas...');
  const recipes = await getRecipes();
  const finalFileName = fileName || 'recipes_catalog.json';
  downloadJson(recipes, finalFileName);
}

// Import functions
export async function importOils(mode: "replace" | "merge", payload: Oil[]): Promise<void> {
  console.log(`📥 Importando óleos (${mode}):`, payload.length);
  
  let finalData: Oil[];
  
  if (mode === "replace") {
    finalData = payload;
  } else {
    // merge
    const baseOils = await getOils();
    const { merged } = mergeOils(baseOils, payload);
    finalData = merged;
  }
  
  try {
    await putOils(finalData);
    console.log('✅ Óleos importados via API');
  } catch (error) {
    console.log('⚠️ API não disponível, oferecendo download');
    const timestamp = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
    downloadJson(finalData, `oils_catalog_backup_${timestamp}.json`);
    throw new Error('API não disponível. Arquivo baixado para substituição manual.');
  }
}

export async function importRecipes(mode: "replace" | "merge", payload: unknown): Promise<void> {
  console.log(`📥 Importando receitas (${mode}):`, payload);
  
  let finalData: RecipesRoot;
  
  if (mode === "replace") {
    const { recipes, version, source_notice } = coerceIncomingRecipes(payload);
    const baseRecipes = await getRecipes();
    finalData = {
      version: version || baseRecipes.version,
      source_notice: source_notice || baseRecipes.source_notice,
      updated_at: new Date().toISOString(),
      recipes
    };
  } else {
    // merge
    const baseRoot = await getRecipes();
    const { mergedRoot } = mergeRecipes(baseRoot, payload);
    finalData = mergedRoot;
  }
  
  try {
    await putRecipes(finalData);
    console.log('✅ Receitas importadas via API');
  } catch (error) {
    console.log('⚠️ API não disponível, oferecendo download');
    const timestamp = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
    downloadJson(finalData, `recipes_catalog_backup_${timestamp}.json`);
    throw new Error('API não disponível. Arquivo baixado para substituição manual.');
  }
}

// Função auxiliar para download de backup
export function downloadJson(data: any, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}