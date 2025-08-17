// Data store with Tauri integration for native file operations

import { notifyChange } from "@/lib/bus";
import { invoke } from '@tauri-apps/api/core';
import { save } from '@tauri-apps/plugin-dialog';

// Types for oils and recipes
export interface Oil {
  id: string;
  tipo_produto?: string | null;
  nome_pt: string;
  nome_latim?: string | null;
  categoria?: string | null;
  familia_botanica?: string | null;
  familia_olfativa?: string | null;
  parte_usada?: string | null;
  metodo_extracao?: string | null;
  metodo_extracao_raw?: string | null;
  familia_olfativa_raw?: string | null;
  principais_constituintes?: Array<{ nome: string; percentual?: number | null }>;
  efeitos_esperados?: string[];
  aplicacoes_sugeridas?: string[];
  veiculos_recomendados?: string[];
  propriedades_tradicionais?: string | null;
  etnobotanica_geral?: string | null;
  precaucoes?: string | null;
  contraindicacoes?: string | null;
  notas_rapidas_seguranca?: string | null;
  uso_pele_sensivel?: boolean | null;
  uso_ambiente_clinico?: boolean | null;
  uso_couro_cabeludo?: boolean | null;
  fototoxico?: boolean | null;
  sensibilizante?: boolean | null;
  publicos_restritos?: {
    gravidez?: boolean | null;
    lactacao?: boolean | null;
    criancas_min_idade?: number | null;
    epilepsia?: boolean | null;
    asma?: boolean | null;
  } | null;
  regiao_origem?: string | null;
  diluicoes?: {
    geral?: string | null;
    valores_percent?: number[] | null;
  } | null;
  sinergias_sugeridas?: string[];
  incompatibilidades_praticas?: string[];
  fontes?: Array<{ url?: string; ref?: string }>;
}

export interface Recipe {
  id: string | number;
  name: string;
  purpose?: string | string[];
  application?: string;
  difficulty?: string;
  prep_time?: string;
  yield?: string;
  ingredients?: Array<any>;
  steps?: string[];
  dilution?: { context?: string; percent?: number; note?: string };
  validity?: string;
  contraindications?: string | string[];
  safety_notes?: string | string[];
  tags?: string[];
  references?: { title?: string; url?: string }[];
}

export interface RecipesRoot {
  recipes: Recipe[];
}

// Oils data management
export async function loadOils(): Promise<Oil[]> {
  // Web version using localStorage
  try {
    const stored = localStorage.getItem('oils_catalog');
    if (stored) {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (error) {
    console.warn('Error loading from localStorage:', error);
  }
  
  // Load seed data
  const seedResponse = await fetch('/data/oils_catalog.json');
  if (seedResponse.ok) {
    const seedData = await seedResponse.json();
    const oils = Array.isArray(seedData) ? seedData : [];
    await saveOils(oils);
    return oils;
  }
  return [];
}

export async function saveOils(oils: Oil[]): Promise<void> {
  // Web version using localStorage
  localStorage.setItem('oils_catalog', JSON.stringify(oils));
  notifyChange({ type: "oils", source: "save" });
}

export async function deleteOil(oilId: string): Promise<void> {
  const oils = await loadOils();
  const updated = oils.filter(o => o.id !== oilId);
  await saveOils(updated);
  notifyChange({ type: "oils", source: "delete" });
}

export async function resetOilsToSeed(): Promise<void> {
  const seedResponse = await fetch('/data/oils_catalog.json');
  if (seedResponse.ok) {
    const seedData = await seedResponse.json();
    const oils = Array.isArray(seedData) ? seedData : [];
    await saveOils(oils);
  }
}

// Recipes data management  
export async function loadRecipes(): Promise<Recipe[]> {
  // Web version using localStorage
  try {
    const stored = localStorage.getItem('recipes_catalog');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Handle different structures
      if (Array.isArray(parsed)) {
        return parsed;
      } else if (parsed.recipes && Array.isArray(parsed.recipes)) {
        return parsed.recipes;
      }
    }
  } catch (error) {
    console.warn('Error loading recipes from localStorage:', error);
  }
  
  // Load seed data
  const seedResponse = await fetch('/data/recipes_catalog.json');
  if (seedResponse.ok) {
    const seedData = await seedResponse.json();
    const recipes = Array.isArray(seedData?.recipes) ? seedData.recipes : 
                   Array.isArray(seedData) ? seedData : [];
    await saveRecipes(recipes);
    return recipes;
  }
  return [];
}

export async function saveRecipes(recipes: Recipe[]): Promise<void> {
  // Web version using localStorage
  const recipesRoot: RecipesRoot = { recipes };
  localStorage.setItem('recipes_catalog', JSON.stringify(recipesRoot));
  notifyChange({ type: "recipes", source: "save" });
}

export async function deleteRecipe(recipeId: string | number): Promise<void> {
  const recipes = await loadRecipes();
  const updated = recipes.filter(r => r.id !== recipeId);
  await saveRecipes(updated);
  notifyChange({ type: "recipes", source: "delete" });
}

export async function resetRecipesToSeed(): Promise<void> {
  const seedResponse = await fetch('/data/recipes_catalog.json');
  if (seedResponse.ok) {
    const seedData = await seedResponse.json();
    const recipes = Array.isArray(seedData?.recipes) ? seedData.recipes : 
                   Array.isArray(seedData) ? seedData : [];
    await saveRecipes(recipes);
  }
}

// Helper function to download JSON as file (web fallback)
function downloadJsonFile(data: any, filename: string): void {
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

// Helper function to read file from input (web fallback)
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

// Export/Import with dialog functions
export async function exportOilsWithDialog(): Promise<string | null> {
  try {
    const destPath = await save({
      defaultPath: 'oils_catalog.json',
      filters: [{
        name: 'JSON Files',
        extensions: ['json']
      }]
    });

    if (!destPath) {
      return null; // User cancelled
    }

    const oils = await loadOils();
    await invoke('export_user_json', {
      name: 'oils.json',
      destPath,
      contents: JSON.stringify(oils, null, 2)
    });

    return destPath;
  } catch (error) {
    // Fallback to web version if Tauri is not available
    console.warn('Tauri not available, falling back to browser download:', error);
    const oils = await loadOils();
    downloadJsonFile(oils, 'oils_catalog.json');
    return 'oils_catalog.json';
  }
}

export async function exportRecipesWithDialog(): Promise<string | null> {
  try {
    const destPath = await save({
      defaultPath: 'recipes_catalog.json',
      filters: [{
        name: 'JSON Files',
        extensions: ['json']
      }]
    });

    if (!destPath) {
      return null; // User cancelled
    }

    const recipes = await loadRecipes();
    const recipesRoot: RecipesRoot = { recipes };
    await invoke('export_user_json', {
      name: 'recipes.json',
      destPath,
      contents: JSON.stringify(recipesRoot, null, 2)
    });

    return destPath;
  } catch (error) {
    // Fallback to web version if Tauri is not available
    console.warn('Tauri not available, falling back to browser download:', error);
    const recipes = await loadRecipes();
    const recipesRoot: RecipesRoot = { recipes };
    downloadJsonFile(recipesRoot, 'recipes_catalog.json');
    return 'recipes_catalog.json';
  }
}

export async function importOilsWithDialog(): Promise<void> {
  // Web version - file input
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const content = await readFileAsText(file);
          const imported = JSON.parse(content);
          const oils = Array.isArray(imported) ? imported : [];
          await saveOils(oils);
          notifyChange({ type: "oils", source: "import" });
          resolve();
        } catch (error) {
          reject(error);
        }
      } else {
        resolve();
      }
    };
    input.click();
  });
}

export async function importRecipesWithDialog(): Promise<void> {
  // Web version - file input
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const content = await readFileAsText(file);
          const imported = JSON.parse(content);
          const recipes = Array.isArray(imported?.recipes) ? imported.recipes : 
                         Array.isArray(imported) ? imported : [];
          await saveRecipes(recipes);
          notifyChange({ type: "recipes", source: "import" });
          resolve();
        } catch (error) {
          reject(error);
        }
      } else {
        resolve();
      }
    };
    input.click();
  });
}

// Get data directory
export async function getDataDir(): Promise<string> {
  // Web version - return localStorage info
  return 'localStorage (dados salvos no navegador)';
}