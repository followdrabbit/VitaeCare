import { useState, useEffect, useMemo, useCallback } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Search, Download, Upload, Edit, Trash2, X, Filter, Leaf, Shield, Beaker } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Oil, Recipe, RecipesRoot } from '@/services/dataStore';
import { 
  loadOils, 
  saveOils, 
  deleteOil,
  loadRecipes, 
  saveRecipes, 
  deleteRecipe,
  exportOilsWithDialog, 
  exportRecipesWithDialog, 
  importOilsWithDialog, 
  importRecipesWithDialog 
} from '@/services/dataStore';
import { OilForm } from '@/components/admin/OilForm';
import { RecipeForm } from '@/components/admin/RecipeForm';
import { ImportDialog } from '@/components/admin/ImportDialog';
import { useDebounce } from '@/hooks/useDebounce';
import { notifyChange } from '@/lib/bus';

// Types for filters
type OilFilters = {
  q?: string;
  intents?: string[];
  apps?: string[];
  safe?: Array<"pele"|"clinico"|"nao_fototoxico"|"baixa_sensibilizacao">;
  publics?: Array<"sem_gravidez"|"sem_lactacao"|"criancas3"|"evitar_epilepsia"|"evitar_asma">;
  constituintes?: string[];
  tipo?: string[];
  famBot?: string[];
  famOlf?: string[];
  parte?: string[];
  metodo?: string[];
  veiculos?: string[];
  regiao?: string[];
  sort?: "relevance"|"name"|"category"|"family";
};

type RecipeFilters = {
  q?: string;
  sort?: "relevance" | "name" | "application" | "difficulty" | "prep_time";
  application?: string[];
  difficulty?: string[];
  tags?: string[];
  intents?: string[];
  ingredients?: string[];
  safety?: Array<"evitar_epilepsia"|"cautela_asma"|"no_gravidez"|"no_pediatrico"|"evitar_fototoxico_leaveon">;
  prepRange?: Array<"lte5"|"btw6_10"|"gt10">;
  dilution?: Array<"no_pct"|"lte1"|"eq2"|"gt2">;
  meta?: Array<"has_contra"|"has_refs">;
};

const INTENT_TERMS: Record<string, string[]> = {
  "Relaxamento/Ansiedade": ["ansiedad","relax","calma","estresse","tensao","nervos","stress"],
  "Sono/Insônia": ["sono","insônia","insonia","dormir","adormecer","descanso"],
  "Foco/Concentração": ["foco","concentracao","aten","cognit","mental","memoria"],
  "Respiratório": ["respirat","tosse","resfri","rinite","sinus","bronq","congest","gripe"],
  "Pele/Sensível": ["dermat","pele","sensivel","sensível","cicatriz","acne","eczema","psorias"],
  "Muscular/Dor": ["muscul","dor","mialg","espasmo","analges","articulac","rigidez"],
  "Antisséptico/Antimicrobiano": ["antissep","antimicrob","antibac","antifung","desinfet","purific"]
};

const RECIPE_INTENT_TERMS: Record<string, string[]> = {
  "Sono": ["sono","insôni","insomi","noturn"],
  "Ansiedade/Relaxamento": ["ansiedad","relax","estresse","calm"],
  "Respiratório": ["respirat","congest","rinite","sinus","tosse","bronq"],
  "Muscular": ["muscul","tens","analges","dor"],
  "Pele/Face": ["pele","face","sérum","serum","acne","oleos"],
  "Purificação/Ambiente": ["purific","ambiente","spray","ar","odor","higien"],
  "Foco": ["foco","concentr","clareza","vigíl","alerta"]
};

const norm = (s?: string|null) => (s||"").normalize("NFD").replace(/\p{Diacritic}/gu,"").toLowerCase();

const Catalogo = () => {
  // Estados gerais
  const [activeTab, setActiveTab] = useState<'oils' | 'recipes'>('oils');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados dos óleos
  const [oils, setOils] = useState<Oil[]>([]);
  const [oilsSearch, setOilsSearch] = useState('');
  const [oilFilters, setOilFilters] = useState<OilFilters>({ sort: 'relevance' });
  const [selectedOil, setSelectedOil] = useState<Oil | null>(null);
  const [isOilFormOpen, setIsOilFormOpen] = useState(false);
  const [deleteOilId, setDeleteOilId] = useState<string | null>(null);
  const [isOilDirty, setIsOilDirty] = useState(false);
  const [constituentesSearch, setConstituentesSearch] = useState('');
  
  // Estados das receitas
  const [recipesRoot, setRecipesRoot] = useState<RecipesRoot | null>(null);
  const [recipesSearch, setRecipesSearch] = useState('');
  const [recipeFilters, setRecipeFilters] = useState<RecipeFilters>({ sort: 'relevance' });
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isRecipeFormOpen, setIsRecipeFormOpen] = useState(false);
  const [deleteRecipeId, setDeleteRecipeId] = useState<string | null>(null);
  const [isRecipeDirty, setIsRecipeDirty] = useState(false);
  
  // Estados de import/export
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importType, setImportType] = useState<'oils' | 'recipes'>('oils');
  const [exportingOils, setExportingOils] = useState(false);
  const [exportingRecipes, setExportingRecipes] = useState(false);
  
  // Estados de confirmação
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  
  // Debounce das pesquisas
  const debouncedOilsSearch = useDebounce(oilsSearch, 400);
  const debouncedRecipesSearch = useDebounce(recipesSearch, 400);

  // Beforeunload protection
  useEffect(() => {
    const isDirty = activeTab === 'oils' ? isOilDirty : isRecipeDirty;
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    if (isDirty) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [activeTab, isOilDirty, isRecipeDirty]);

  // Carregar dados iniciais
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [oilsData, recipesData] = await Promise.all([
        loadOils(),
        loadRecipes()
      ]);
      setOils(oilsData);
      setRecipesRoot({ recipes: recipesData });
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Utility functions for filtering
  const matchesAny = useCallback(<T,>(itemVals: T[]|undefined, selected: T[]|undefined, proj:(v:T)=>string = v=>String(v)): boolean => {
    if (!selected || selected.length===0) return true;
    const set = new Set(selected.map(v=>norm(String(v))));
    return (itemVals||[]).some(v => set.has(norm(proj(v))));
  }, []);

  // Oils filtering logic (matching public page)
  const applyOilFilters = useCallback((data: Oil[], f: OilFilters): { rows: Oil[]; score: Map<string, number> } => {
    const score = new Map<string, number>();
    const q = norm(f.q);

    const rows = data.filter(o => {
      let ok = true, s = 0;

      // Search query
      if (q) {
        const searchableText = [
          o.nome_pt, o.nome_latim,
          ...(o.efeitos_esperados||[]), 
          ...(o.aplicacoes_sugeridas||[]),
          ...((o.principais_constituintes||[]).map(c=>c.nome))
        ].map(norm).join(" ");
        ok = searchableText.includes(q);
        if (ok) s += 5;
      }

      // Quick intents (effects mapping)
      if (ok && f.intents?.length) {
        const effectsText = (o.efeitos_esperados||[]).map(norm).join(" ");
        ok = f.intents.some(intent => (INTENT_TERMS[intent]||[]).some(t => effectsText.includes(t)));
        if (ok) s += 3;
      }

      // Applications
      ok = ok && matchesAny(o.aplicacoes_sugeridas, f.apps);

      // Safety toggles
      if (ok && f.safe?.includes("pele")) ok = o.uso_pele_sensivel === true;
      if (ok && f.safe?.includes("clinico")) ok = o.uso_ambiente_clinico === true;
      if (ok && f.safe?.includes("nao_fototoxico")) ok = o.fototoxico === false;
      if (ok && f.safe?.includes("baixa_sensibilizacao")) ok = o.sensibilizante === false;

      // Public restrictions
      if (ok && f.publics?.includes("sem_gravidez")) ok = !(o.publicos_restritos?.gravidez);
      if (ok && f.publics?.includes("sem_lactacao")) ok = !(o.publicos_restritos?.lactacao);
      if (ok && f.publics?.includes("criancas3")) {
        const min = o.publicos_restritos?.criancas_min_idade;
        ok = typeof min === "number" ? min <= 3 : false;
      }
      if (ok && f.publics?.includes("evitar_epilepsia")) ok = !!(o.publicos_restritos?.epilepsia);
      if (ok && f.publics?.includes("evitar_asma")) ok = !!(o.publicos_restritos?.asma);

      // Constituents
      if (ok && f.constituintes?.length) {
        const names = (o.principais_constituintes||[]).map(c=>c.nome);
        ok = matchesAny(names, f.constituintes);
      }

      // Taxonomies and methods
      ok = ok && matchesAny([o.tipo_produto||""], f.tipo);
      ok = ok && matchesAny([o.familia_botanica||""], f.famBot);
      ok = ok && matchesAny([o.familia_olfativa||""], f.famOlf);
      ok = ok && matchesAny([o.parte_usada||""], f.parte);
      ok = ok && matchesAny([o.metodo_extracao||""], f.metodo);
      ok = ok && matchesAny(o.veiculos_recomendados, f.veiculos);
      ok = ok && matchesAny([o.regiao_origem||""], f.regiao);

      if (ok) score.set(o.id, s);
      return ok;
    });

    // Sorting
    const sorted = [...rows].sort((a,b) => {
      const by = f.sort || "relevance";
      if (by === "name") return (a.nome_pt||"").localeCompare(b.nome_pt||"");
      if (by === "category") return (a.categoria||"").localeCompare(b.categoria||"");
      if (by === "family") return (a.familia_botanica||"").localeCompare(b.familia_botanica||"");
      // relevance (score desc, fallback nome)
      const sa = score.get(a.id)||0, sb = score.get(b.id)||0;
      if (sb !== sa) return sb - sa;
      return (a.nome_pt||"").localeCompare(b.nome_pt||"");
    });

    return { rows: sorted, score };
  }, [matchesAny]);

  // Recipe filtering logic (matching public page)
  const applyRecipeFilters = useCallback((data: Recipe[], f: RecipeFilters) => {
    const q = norm(f.q);
    const toArray = (v: any) => Array.isArray(v) ? v : (v ? [v] : []);
    
    const filtered = data.filter(r => {
      let ok = true;
      
      // Search query
      if (q) {
        const searchableText = [
          r.name, r.application, r.difficulty,
          ...toArray(r.purpose), ...toArray(r.tags),
          ...toArray(r.ingredients).map(i => typeof i === "string" ? i : [i.name_pt, (i as any).latin].filter(Boolean).join(" ")),
          ...toArray(r.steps), ...toArray(r.safety_notes), ...toArray(r.contraindications)
        ].map(norm).join(" ");
        ok = searchableText.includes(q);
      }

      // INTENÇÕES (purpose/tags)
      if (ok && (f.intents?.length)) {
        const bagIntent = [...toArray(r.purpose), ...toArray(r.tags)].map(norm).join(" ");
        ok = f.intents.some(intent => (RECIPE_INTENT_TERMS[intent]||[]).some(t => bagIntent.includes(t)));
      }

      // Aplicação
      if (ok && (f.application?.length)) ok = f.application.includes(r.application || "");
      // Dificuldade
      if (ok && (f.difficulty?.length)) ok = f.difficulty.includes(r.difficulty || "");

      // INGREDIENTES
      if (ok && (f.ingredients?.length)) {
        const ingBag = toArray(r.ingredients);
        ok = ingBag.some(ing => {
          if (typeof ing === "string") return f.ingredients!.some(val => norm(ing) === norm(val));
          const vals = [ing.name_pt, (ing as any).latin].filter(Boolean).map(String);
          return vals.some(v => f.ingredients!.some(val => norm(v) === norm(val)));
        });
      }

      // Tags
      if (ok && (f.tags?.length)) ok = toArray(r.tags).some(t => f.tags!.includes(t));

      // SEGURANÇA
      if (ok && (f.safety?.length)) {
        const mentions = [...toArray(r.safety_notes), ...toArray(r.contraindications)].map(norm).join(" ");
        const mustMention = f.safety.filter(s => s==="evitar_epilepsia" || s==="cautela_asma");
        const mustNotMention = f.safety.filter(s => s==="no_gravidez" || s==="no_pediatrico");
        const avoidFoto = f.safety.includes("evitar_fototoxico_leaveon");

        if (mustMention.length) {
          ok = mustMention.every(flag => {
            if (flag === "evitar_epilepsia") return /epileps/.test(mentions);
            if (flag === "cautela_asma") return /asma/.test(mentions);
            return true;
          });
        }
        if (ok && mustNotMention.length) {
          ok = mustNotMention.every(flag => {
            if (flag === "no_gravidez") return !/gravid/.test(mentions);
            if (flag === "no_pediatrico") return !/(crian|beb|pediatr)/.test(mentions);
            return true;
          });
        }
        if (ok && avoidFoto) {
          const leaveOn = /(roll|sérum|serum|leave-?on|tópico|topico)/.test(norm(r.application));
          const foto = /(foto|fototóx|fotossens)/.test(mentions);
          ok = !(leaveOn && foto);
        }
      }

      // TEMPO DE PREPARO
      if (ok && (f.prepRange?.length)) {
        const parseMinutes = (prep?: string): number | null => {
          if (!prep) return null;
          const m = prep.match(/(\d+)\s*min/gi);
          if (!m) return null;
          const n = m.map(x => parseInt(x,10)).filter(n=>!isNaN(n));
          return n.length ? Math.max(...n) : null;
        };
        const min = parseMinutes(r.prep_time || "");
        const band = (min==null) ? null
          : (min <= 5 ? "lte5" : (min <= 10 ? "btw6_10" : "gt10"));
        ok = band != null && f.prepRange.includes(band);
      }

      // DILUIÇÃO
      if (ok && (f.dilution?.length)) {
        const dilutionBand = (pct?: number | null | undefined): "no_pct"|"lte1"|"eq2"|"gt2" | null => {
          if (pct == null) return "no_pct";
          if (pct <= 1) return "lte1";
          if (Math.abs(pct - 2) < 0.01) return "eq2";
          if (pct > 2) return "gt2";
          return null;
        };
        const band = dilutionBand(r.dilution?.percent);
        ok = band != null && f.dilution.includes(band);
      }

      // META
      if (ok && (f.meta?.length)) {
        const hasContra = toArray(r.contraindications).length > 0;
        const hasRefs = toArray(r.references).length > 0;
        ok = f.meta.every(m => 
          (m==="has_contra" ? hasContra : true) &&
          (m==="has_refs" ? hasRefs : true)
        );
      }

      return ok;
    });

    // Ordenação
    return [...filtered].sort((a, b) => {
      const by = f.sort || "relevance";
      if (by === "name") return (a.name || "").localeCompare(b.name || "");
      if (by === "application") return (a.application || "").localeCompare(b.application || "");
      if (by === "difficulty") return (a.difficulty || "").localeCompare(b.difficulty || "");
      if (by === "prep_time") {
        const parseMinutes = (prep?: string): number => {
          if (!prep) return 1e9;
          const m = prep.match(/(\d+)\s*min/gi);
          if (!m) return 1e9;
          const n = m.map(x => parseInt(x,10)).filter(n=>!isNaN(n));
          return n.length ? Math.max(...n) : 1e9;
        };
        const pa = parseMinutes(a.prep_time || "");
        const pb = parseMinutes(b.prep_time || "");
        if (pa !== pb) return pa - pb;
      }
      // Relevance: prioriza busca no nome
      if (f.q) {
        const inA = norm(a.name).includes(q) ? 1 : 0;
        const inB = norm(b.name).includes(q) ? 1 : 0;
        if (inB !== inA) return inB - inA;
      }
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [matchesAny]);

  // Calculate facet counts for oils (matching public page)
  const oilFacetCounts = useMemo(() => {
    if (!oils.length) return {
      apps: [], tipo: [], famBot: [], famOlf: [], parte: [], 
      metodo: [], veiculos: [], regiao: [], constituintes: []
    };
    
    const facets = [
      ["apps", (o: Oil) => o.aplicacoes_sugeridas||[]],
      ["tipo", (o: Oil) => o.tipo_produto?[o.tipo_produto]:[]],
      ["famBot", (o: Oil) => o.familia_botanica?[o.familia_botanica]:[]],
      ["famOlf", (o: Oil) => o.familia_olfativa?[o.familia_olfativa]:[]],
      ["parte", (o: Oil) => o.parte_usada?[o.parte_usada]:[]],
      ["metodo", (o: Oil) => o.metodo_extracao?[o.metodo_extracao]:[]],
      ["veiculos", (o: Oil) => o.veiculos_recomendados||[]],
      ["regiao", (o: Oil) => o.regiao_origem?[o.regiao_origem]:[]],
      ["constituintes", (o: Oil) => (o.principais_constituintes||[]).map(c=>c.nome)]
    ] as const;
    
    const out: Record<string, Array<{value:string; count:number}>> = {};
    
    for (const [key, proj] of facets) {
      const f2 = { ...oilFilters, [key]: [] };
      const subset = applyOilFilters(oils, f2).rows;
      const map = new Map<string, number>();
      subset.forEach(o => proj(o).forEach(v => map.set(v, (map.get(v)||0)+1)));
      out[key] = [...map.entries()].sort((a,b)=> b[1]-a[1]).map(([value,count])=>({value, count}));
    }
    return out;
  }, [oils, oilFilters, applyOilFilters]);

  // Calculate facet counts for recipes (matching public page)
  const recipeFacetCounts = useMemo(() => {
    if (!recipesRoot?.recipes.length) return {
      application: [], difficulty: [], tags: [], ingredients: []
    };
    
    const recipes = recipesRoot.recipes;
    const toArray = (v: any) => Array.isArray(v) ? v : (v ? [v] : []);
    
    const facets = [
      ["application", (r: Recipe) => r.application?[r.application]:[]],
      ["difficulty", (r: Recipe) => r.difficulty?[r.difficulty]:[]],
      ["tags", (r: Recipe) => toArray(r.tags)],
      ["ingredients", (r: Recipe) => {
        const set = new Set<string>();
        (toArray(r.ingredients)).forEach((ing: any) => {
          if (typeof ing === "string") { set.add(ing); }
          else {
            if (ing.name_pt) set.add(ing.name_pt);
            if (ing.latin) set.add(ing.latin);
          }
        });
        return Array.from(set);
      }]
    ] as const;
    
    const out: Record<string, Array<{value:string; count:number}>> = {};
    
    for (const [key, proj] of facets) {
      const f2 = { ...recipeFilters, [key]: [] };
      const subset = applyRecipeFilters(recipes, f2);
      const map = new Map<string, number>();
      subset.forEach(r => proj(r).forEach(v => map.set(v, (map.get(v)||0)+1)));
      out[key] = [...map.entries()].sort((a,b)=> b[1]-a[1]).map(([value,count])=>({value, count}));
    }
    return out;
  }, [recipesRoot, recipeFilters, applyRecipeFilters]);

  // Apply filters
  const filteredOils = useMemo(() => {
    const merged = { ...oilFilters, q: debouncedOilsSearch };
    return applyOilFilters(oils, merged).rows;
  }, [oils, oilFilters, debouncedOilsSearch, applyOilFilters]);

  const filteredRecipes = useMemo(() => {
    if (!recipesRoot) return [];
    const merged = { ...recipeFilters, q: debouncedRecipesSearch };
    return applyRecipeFilters(recipesRoot.recipes, merged);
  }, [recipesRoot, recipeFilters, debouncedRecipesSearch, applyRecipeFilters]);

  // Get top constituents for filter
  const topConstituents = useMemo(() => {
    const filtered = constituentesSearch ? 
      (oilFacetCounts.constituintes || []).filter(c => 
        norm(c.value).includes(norm(constituentesSearch))
      ) : 
      (oilFacetCounts.constituintes || []).slice(0, 20);
    return filtered;
  }, [oilFacetCounts.constituintes, constituentesSearch]);

  // Filter helpers
  const toggleOilArrayFilter = useCallback((key: keyof OilFilters, value: string) => {
    const current = oilFilters[key] as string[] || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    setOilFilters(prev => ({ ...prev, [key]: updated }));
  }, [oilFilters]);

  const toggleRecipeArrayFilter = useCallback((key: keyof RecipeFilters, value: string) => {
    const current = recipeFilters[key] as string[] || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    setRecipeFilters(prev => ({ ...prev, [key]: updated }));
  }, [recipeFilters]);

  const clearOilFilters = useCallback(() => {
    setOilFilters({ sort: 'relevance' });
    setOilsSearch('');
    setConstituentesSearch('');
  }, []);

  const clearRecipeFilters = useCallback(() => {
    setRecipeFilters({ sort: 'relevance' });
    setRecipesSearch('');
  }, []);

  // Get active filter chips (oils)
  const getOilActiveChips = useCallback(() => {
    const chips: Array<{label: string; key: string; value?: string; stableKey: string}> = [];
    
    if (oilFilters.q) chips.push({label: `"${oilFilters.q}"`, key: 'q', stableKey: 'q'});
    
    oilFilters.intents?.forEach(intent => 
      chips.push({label: intent, key: 'intents', value: intent, stableKey: `intents:${intent}`}));
    
    oilFilters.apps?.forEach(app => 
      chips.push({label: 'App: ' + app, key: 'apps', value: app, stableKey: `apps:${app}`}));
    
    if (oilFilters.safe?.includes("pele")) chips.push({label: "Seguro p/ pele sensível", key: 'safe', value: 'pele', stableKey: 'safe:pele'});
    if (oilFilters.safe?.includes("clinico")) chips.push({label: "Adequado p/ ambiente clínico", key: 'safe', value: 'clinico', stableKey: 'safe:clinico'});
    if (oilFilters.safe?.includes("nao_fototoxico")) chips.push({label: "Não fototóxico", key: 'safe', value: 'nao_fototoxico', stableKey: 'safe:nao_fototoxico'});
    if (oilFilters.safe?.includes("baixa_sensibilizacao")) chips.push({label: "Baixa sensibilização", key: 'safe', value: 'baixa_sensibilizacao', stableKey: 'safe:baixa_sensibilizacao'});
    
    oilFilters.publics?.forEach(pub => {
      const labels: Record<string, string> = {
        "sem_gravidez": "Sem restr. gravidez",
        "sem_lactacao": "Sem restr. lactação", 
        "criancas3": "Crianças ≥ 3 anos",
        "evitar_epilepsia": "Evitar epilepsia",
        "evitar_asma": "Evitar asma"
      };
      chips.push({label: labels[pub], key: 'publics', value: pub, stableKey: `publics:${pub}`});
    });
    
    oilFilters.constituintes?.forEach(constituinte => 
      chips.push({label: 'Constituinte: ' + constituinte, key: 'constituintes', value: constituinte, stableKey: `constituintes:${constituinte}`}));
    
    oilFilters.tipo?.forEach(tipo => 
      chips.push({label: 'Tipo: ' + tipo, key: 'tipo', value: tipo, stableKey: `tipo:${tipo}`}));
    
    oilFilters.famBot?.forEach(famBot => 
      chips.push({label: 'Fam. bot.: ' + famBot, key: 'famBot', value: famBot, stableKey: `famBot:${famBot}`}));
    
    oilFilters.famOlf?.forEach(famOlf => 
      chips.push({label: 'Fam. olf.: ' + famOlf, key: 'famOlf', value: famOlf, stableKey: `famOlf:${famOlf}`}));
    
    oilFilters.parte?.forEach(parte => 
      chips.push({label: 'Parte: ' + parte, key: 'parte', value: parte, stableKey: `parte:${parte}`}));
    
    oilFilters.metodo?.forEach(metodo => 
      chips.push({label: 'Método: ' + metodo, key: 'metodo', value: metodo, stableKey: `metodo:${metodo}`}));
    
    oilFilters.veiculos?.forEach(veiculo => 
      chips.push({label: 'Veículo: ' + veiculo, key: 'veiculos', value: veiculo, stableKey: `veiculos:${veiculo}`}));
    
    oilFilters.regiao?.forEach(regiao => 
      chips.push({label: 'Região: ' + regiao, key: 'regiao', value: regiao, stableKey: `regiao:${regiao}`}));
    
    return chips;
  }, [oilFilters]);

  // Remove oil filter helper
  const removeOilFilter = useCallback((key: string, value?: string) => {
    if (key === 'q') {
      setOilsSearch('');
      setOilFilters(prev => ({ ...prev, q: '' }));
    } else if (value) {
      toggleOilArrayFilter(key as keyof OilFilters, value);
    }
  }, [toggleOilArrayFilter]);

  // Navigation guards and dirty state
  const checkExitConfirm = useCallback((action: () => void) => {
    const isDirty = activeTab === 'oils' ? isOilDirty : isRecipeDirty;
    if (isDirty) {
      setPendingAction(() => action);
      setExitConfirmOpen(true);
    } else {
      action();
    }
  }, [activeTab, isOilDirty, isRecipeDirty]);

  const handleTabChange = useCallback((value: string) => {
    checkExitConfirm(() => setActiveTab(value as 'oils' | 'recipes'));
  }, [checkExitConfirm]);

  // Form handlers
  const handleCreateOil = () => {
    checkExitConfirm(() => {
      setSelectedOil(null);
      setIsOilDirty(false);
      setIsOilFormOpen(true);
    });
  };

  const handleEditOil = (oil: Oil) => {
    checkExitConfirm(() => {
      setSelectedOil(oil);
      setIsOilDirty(false);
      setIsOilFormOpen(true);
    });
  };

  const handleSaveOil = async (oil: Oil) => {
    setSaveConfirmOpen(true);
    setPendingAction(() => async () => {
      const updatedOils = selectedOil 
        ? oils.map(o => o.id === selectedOil.id ? oil : o)
        : [...oils, oil];
      
      try {
        await saveOils(updatedOils.sort((a, b) => (a.nome_pt || '').localeCompare(b.nome_pt || '')));
        await loadData(); // garante recarga a partir do arquivo em disco
        setIsOilFormOpen(false);
        setSelectedOil(null);
        setIsOilDirty(false);
        toast({
          title: 'Sucesso',
          description: 'Arquivo oils_catalog.json atualizado com sucesso.'
        });
        notifyChange({ type: "oils", source: "save" });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar óleo';
        toast({ 
          title: errorMessage.includes('API não disponível') ? 'Download Automático' : 'Erro', 
          description: errorMessage,
          variant: errorMessage.includes('API não disponível') ? 'default' : 'destructive'
        });
        
        // Se foi um download automático, ainda considera sucesso local
        if (errorMessage.includes('API não disponível')) {
          setOils(updatedOils);
          setIsOilFormOpen(false);
          setSelectedOil(null);
          setIsOilDirty(false);
          notifyChange({ type: "oils", source: "save" });
        }
      }
    });
  };

  const handleDeleteOil = async (id: string) => {
    try {
      await deleteOil(id);
      setOils(await loadOils()); // Recarregar dados atualizados
      setDeleteOilId(null);
      toast({ title: 'Sucesso', description: 'Óleo excluído com sucesso!' });
      notifyChange({ type: "oils", source: "delete" });
    } catch (err) {
      toast({ 
        title: 'Erro', 
        description: err instanceof Error ? err.message : 'Erro ao excluir óleo',
        variant: 'destructive'
      });
    }
  };

  // Handlers para receitas
  const handleCreateRecipe = () => {
    checkExitConfirm(() => {
      setSelectedRecipe(null);
      setIsRecipeDirty(false);
      setIsRecipeFormOpen(true);
    });
  };

  const handleEditRecipe = (recipe: Recipe) => {
    checkExitConfirm(() => {
      setSelectedRecipe(recipe);
      setIsRecipeDirty(false);
      setIsRecipeFormOpen(true);
    });
  };

  const handleSaveRecipe = async (recipe: Recipe) => {
    if (!recipesRoot) return;
    
    setSaveConfirmOpen(true);
    setPendingAction(() => async () => {
      const updatedRecipes = selectedRecipe 
        ? recipesRoot.recipes.map(r => r.id === selectedRecipe.id ? recipe : r)
        : [...recipesRoot.recipes, recipe];
      
      const updatedRoot = {
        ...recipesRoot,
        recipes: updatedRecipes.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      };
      
      try {
        await saveRecipes(updatedRecipes.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
        await loadData(); // recarrega inclusive updated_at no header
        setIsRecipeFormOpen(false);
        setSelectedRecipe(null);
        setIsRecipeDirty(false);
        toast({
          title: 'Sucesso',
          description: 'Arquivo recipes_catalog.json atualizado com sucesso.'
        });
        notifyChange({ type: "recipes", source: "save" });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar receita';
        toast({ 
          title: errorMessage.includes('API não disponível') ? 'Download Automático' : 'Erro', 
          description: errorMessage,
          variant: errorMessage.includes('API não disponível') ? 'default' : 'destructive'
        });
        
        // Se foi um download automático, ainda considera sucesso local
        if (errorMessage.includes('API não disponível')) {
          setRecipesRoot(updatedRoot);
          setIsRecipeFormOpen(false);
          setSelectedRecipe(null);
          setIsRecipeDirty(false);
          notifyChange({ type: "recipes", source: "save" });
        }
      }
    });
  };

  const handleDeleteRecipe = async (id: string) => {
    if (!recipesRoot) return;
    
    try {
      await deleteRecipe(id);
      const refreshedRecipes = await loadRecipes();
      setRecipesRoot({ recipes: refreshedRecipes });
      setDeleteRecipeId(null);
      toast({ title: 'Sucesso', description: 'Receita excluída com sucesso!' });
      notifyChange({ type: "recipes", source: "delete" });
    } catch (err) {
      toast({ 
        title: 'Erro', 
        description: err instanceof Error ? err.message : 'Erro ao excluir receita',
        variant: 'destructive'
      });
    }
  };

  // Handlers de importação/exportação
  const handleExportOils = async () => {
    setExportingOils(true);
    try {
      const destPath = await exportOilsWithDialog();
      if (destPath) {
        toast({ 
          title: 'Sucesso', 
          description: `Óleos exportados para: ${destPath}` 
        });
      }
      // If destPath is null, user cancelled - no toast needed
    } catch (err) {
      toast({ 
        title: 'Erro', 
        description: err instanceof Error ? err.message : 'Erro ao exportar óleos',
        variant: 'destructive'
      });
    } finally {
      setExportingOils(false);
    }
  };

  const handleExportRecipes = async () => {
    setExportingRecipes(true);
    try {
      const destPath = await exportRecipesWithDialog();
      if (destPath) {
        toast({ 
          title: 'Sucesso', 
          description: `Receitas exportadas para: ${destPath}` 
        });
      }
      // If destPath is null, user cancelled - no toast needed
    } catch (err) {
      toast({ 
        title: 'Erro', 
        description: err instanceof Error ? err.message : 'Erro ao exportar receitas',
        variant: 'destructive'
      });
    } finally {
      setExportingRecipes(false);
    }
  };

  const handleImportOils = async (mode: 'replace' | 'merge', data: Oil[]) => {
    try {
      await saveOils(data); // Save imported data
      setOils(await loadOils()); // Refresh local state
      toast({ 
        title: 'Sucesso', 
        description: `Óleos ${mode === 'replace' ? 'substituídos' : 'mesclados'} com sucesso!` 
      });
      notifyChange({ type: "oils", source: "import" });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao importar óleos';
      toast({ 
        title: 'Erro', 
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };

  const handleImportRecipes = async (mode: 'replace' | 'merge', data: any) => {
    try {
      const recipes = Array.isArray(data?.recipes) ? data.recipes : 
                     Array.isArray(data) ? data : [];
      await saveRecipes(recipes); // Save imported data
      const refreshedRecipes = await loadRecipes();
      setRecipesRoot({ recipes: refreshedRecipes }); // Refresh local state
      toast({ 
        title: 'Sucesso', 
        description: `Receitas ${mode === 'replace' ? 'substituídas' : 'mescladas'} com sucesso!` 
      });
      notifyChange({ type: "recipes", source: "import" });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao importar receitas';
      toast({ 
        title: 'Erro', 
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };

  const openImportDialog = (type: 'oils' | 'recipes') => {
    setImportType(type);
    setImportDialogOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent, searchType: 'oils' | 'recipes') => {
    if (e.key === 'Enter') {
      // O debounce já cuida da filtragem
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={loadData}>Tentar novamente</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-6 max-w-7xl">
        <h1 className="text-3xl font-bold mb-6">Administração de Catálogos</h1>
        
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="oils">Óleos Essenciais</TabsTrigger>
            <TabsTrigger value="recipes">Receitas</TabsTrigger>
          </TabsList>

        <TabsContent value="oils" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  Óleos Essenciais
                  <Badge variant="secondary" aria-live="polite">
                    {filteredOils.length} de {oils.length} itens
                  </Badge>
                </CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleExportOils}
                    disabled={exportingOils}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {exportingOils ? 'Exportando...' : 'Exportar'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openImportDialog('oils')}>
                    <Upload className="w-4 h-4 mr-2" />
                    Importar
                  </Button>
                  <Button onClick={handleCreateOil}>
                    <Plus className="w-4 h-4 mr-2" />
                    Novo
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Busca e Intenções */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Search className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Busca e Intenções</h3>
                  </div>
                  
                  {/* Barra de Pesquisa */}
                  <div className="mb-6">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        inputMode="search"
                        enterKeyHint="search"
                        aria-label="Buscar óleos essenciais por nome, efeito, aplicação ou constituinte"
                        placeholder="Busque por nome, sintoma/efeito, aplicação ou constituinte..."
                        value={oilsSearch}
                        onChange={(e) => setOilsSearch(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            if (oilsSearch !== oilFilters.q) {
                              setOilFilters(prev => ({ ...prev, q: oilsSearch }));
                            }
                            (e.currentTarget as HTMLInputElement).blur();
                          }
                        }}
                        className="pl-10 pr-20"
                      />
                      {oilsSearch && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1 h-8 w-8 p-0"
                          onClick={() => {
                            setOilsSearch('');
                            setOilFilters(prev => ({ ...prev, q: '' }));
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Intenções Rápidas */}
                  <div>
                    <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">Intenções Rápidas</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(INTENT_TERMS).map((intent) => (
                        <Button
                          key={intent}
                          variant={oilFilters.intents?.includes(intent) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleOilArrayFilter('intents', intent)}
                        >
                          {intent}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Segurança e Público-Alvo */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Segurança e Público-Alvo</h3>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Critérios de Segurança */}
                    <div>
                      <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">Critérios de Segurança</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="safe-pele"
                            checked={oilFilters.safe?.includes("pele")}
                            onCheckedChange={() => toggleOilArrayFilter('safe', 'pele')}
                          />
                          <label htmlFor="safe-pele" className="text-sm cursor-pointer">
                            Seguro para pele sensível
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="safe-clinico"
                            checked={oilFilters.safe?.includes("clinico")}
                            onCheckedChange={() => toggleOilArrayFilter('safe', 'clinico')}
                          />
                          <label htmlFor="safe-clinico" className="text-sm cursor-pointer">
                            Adequado para ambiente clínico
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="safe-fototoxico"
                            checked={oilFilters.safe?.includes("nao_fototoxico")}
                            onCheckedChange={() => toggleOilArrayFilter('safe', 'nao_fototoxico')}
                          />
                          <label htmlFor="safe-fototoxico" className="text-sm cursor-pointer">
                            Não fototóxico (leave-on)
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="safe-sensibilizacao"
                            checked={oilFilters.safe?.includes("baixa_sensibilizacao")}
                            onCheckedChange={() => toggleOilArrayFilter('safe', 'baixa_sensibilizacao')}
                          />
                          <label htmlFor="safe-sensibilizacao" className="text-sm cursor-pointer">
                            Baixa propensão a sensibilização
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Públicos Específicos */}
                    <div>
                      <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">Públicos Específicos</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="pub-gravidez"
                            checked={oilFilters.publics?.includes("sem_gravidez")}
                            onCheckedChange={() => toggleOilArrayFilter('publics', 'sem_gravidez')}
                          />
                          <label htmlFor="pub-gravidez" className="text-sm cursor-pointer">
                            Sem restrições na gravidez
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="pub-lactacao"
                            checked={oilFilters.publics?.includes("sem_lactacao")}
                            onCheckedChange={() => toggleOilArrayFilter('publics', 'sem_lactacao')}
                          />
                          <label htmlFor="pub-lactacao" className="text-sm cursor-pointer">
                            Sem restrições na lactação
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="pub-criancas"
                            checked={oilFilters.publics?.includes("criancas3")}
                            onCheckedChange={() => toggleOilArrayFilter('publics', 'criancas3')}
                          />
                          <label htmlFor="pub-criancas" className="text-sm cursor-pointer">
                            Adequado para crianças ≥ 3 anos
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Propriedades e Aplicação */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Beaker className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Propriedades e Aplicação</h3>
                  </div>

                  <Accordion type="multiple" defaultValue={["apps"]} className="w-full">
                    {/* Applications */}
                    <AccordionItem value="apps">
                      <AccordionTrigger className="text-sm font-medium">Tipo de Aplicação</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {(oilFacetCounts.apps || []).map((item) => (
                            <div key={item.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={'app-' + item.value}
                                checked={oilFilters.apps?.includes(item.value)}
                                onCheckedChange={() => toggleOilArrayFilter('apps', item.value)}
                              />
                              <label htmlFor={'app-' + item.value} className="text-sm flex-1 cursor-pointer">
                                {item.value} <span className="text-muted-foreground">({item.count})</span>
                              </label>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Constituents */}
                    <AccordionItem value="constituintes">
                      <AccordionTrigger className="text-sm font-medium">Constituintes Principais</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3">
                          <Input
                            placeholder="Buscar constituintes..."
                            value={constituentesSearch}
                            onChange={(e) => setConstituentesSearch(e.target.value)}
                            className="mb-2"
                          />
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {topConstituents.map((item) => (
                              <div key={item.value} className="flex items-center space-x-2">
                                <Checkbox
                                  id={'const-' + item.value}
                                  checked={oilFilters.constituintes?.includes(item.value)}
                                  onCheckedChange={() => toggleOilArrayFilter('constituintes', item.value)}
                                />
                                <label htmlFor={'const-' + item.value} className="text-sm flex-1 cursor-pointer">
                                  {item.value} <span className="text-muted-foreground">({item.count})</span>
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Recommended Vehicles */}
                    <AccordionItem value="veiculos">
                      <AccordionTrigger className="text-sm font-medium">Veículos Recomendados</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {(oilFacetCounts.veiculos || []).map((item) => (
                            <div key={item.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={'veiculo-' + item.value}
                                checked={oilFilters.veiculos?.includes(item.value)}
                                onCheckedChange={() => toggleOilArrayFilter('veiculos', item.value)}
                              />
                              <label htmlFor={'veiculo-' + item.value} className="text-sm flex-1 cursor-pointer">
                                {item.value} <span className="text-muted-foreground">({item.count})</span>
                              </label>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>

              {/* Classificação Taxonômica */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Leaf className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Classificação Taxonômica</h3>
                  </div>

                  <Accordion type="multiple" className="w-full">
                    {/* Product Type */}
                    <AccordionItem value="tipo">
                      <AccordionTrigger className="text-sm font-medium">Tipo de Produto</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          {(oilFacetCounts.tipo || []).map((item) => (
                            <div key={item.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={'tipo-' + item.value}
                                checked={oilFilters.tipo?.includes(item.value)}
                                onCheckedChange={() => toggleOilArrayFilter('tipo', item.value)}
                              />
                              <label htmlFor={'tipo-' + item.value} className="text-sm flex-1 cursor-pointer">
                                {item.value} <span className="text-muted-foreground">({item.count})</span>
                              </label>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Botanical Family */}
                    <AccordionItem value="famBot">
                      <AccordionTrigger className="text-sm font-medium">Família Botânica</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {(oilFacetCounts.famBot || []).map((item) => (
                            <div key={item.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={'famBot-' + item.value}
                                checked={oilFilters.famBot?.includes(item.value)}
                                onCheckedChange={() => toggleOilArrayFilter('famBot', item.value)}
                              />
                              <label htmlFor={'famBot-' + item.value} className="text-sm flex-1 cursor-pointer">
                                {item.value} <span className="text-muted-foreground">({item.count})</span>
                              </label>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Olfactory Family */}
                    <AccordionItem value="famOlf">
                      <AccordionTrigger className="text-sm font-medium">Família Olfativa</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {(oilFacetCounts.famOlf || []).map((item) => (
                            <div key={item.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={'famOlf-' + item.value}
                                checked={oilFilters.famOlf?.includes(item.value)}
                                onCheckedChange={() => toggleOilArrayFilter('famOlf', item.value)}
                              />
                              <label htmlFor={'famOlf-' + item.value} className="text-sm flex-1 cursor-pointer">
                                {item.value} <span className="text-muted-foreground">({item.count})</span>
                              </label>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Plant Part */}
                    <AccordionItem value="parte">
                      <AccordionTrigger className="text-sm font-medium">Parte Usada</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {(oilFacetCounts.parte || []).map((item) => (
                            <div key={item.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={'parte-' + item.value}
                                checked={oilFilters.parte?.includes(item.value)}
                                onCheckedChange={() => toggleOilArrayFilter('parte', item.value)}
                              />
                              <label htmlFor={'parte-' + item.value} className="text-sm flex-1 cursor-pointer">
                                {item.value} <span className="text-muted-foreground">({item.count})</span>
                              </label>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Extraction Method */}
                    <AccordionItem value="metodo">
                      <AccordionTrigger className="text-sm font-medium">Método de Extração</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {(oilFacetCounts.metodo || []).map((item) => (
                            <div key={item.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={'metodo-' + item.value}
                                checked={oilFilters.metodo?.includes(item.value)}
                                onCheckedChange={() => toggleOilArrayFilter('metodo', item.value)}
                              />
                              <label htmlFor={'metodo-' + item.value} className="text-sm flex-1 cursor-pointer">
                                {item.value} <span className="text-muted-foreground">({item.count})</span>
                              </label>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Origin Region */}
                    <AccordionItem value="regiao">
                      <AccordionTrigger className="text-sm font-medium">Região de Origem</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {(oilFacetCounts.regiao || []).map((item) => (
                            <div key={item.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={'regiao-' + item.value}
                                checked={oilFilters.regiao?.includes(item.value)}
                                onCheckedChange={() => toggleOilArrayFilter('regiao', item.value)}
                              />
                              <label htmlFor={'regiao-' + item.value} className="text-sm flex-1 cursor-pointer">
                                {item.value} <span className="text-muted-foreground">({item.count})</span>
                              </label>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>

              {/* Ordenação e Filtros Ativos */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Ordenação</h4>
                    <Select 
                      value={oilFilters.sort || "relevance"} 
                      onValueChange={(v) => setOilFilters(prev => ({ ...prev, sort: v as OilFilters["sort"] }))}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Relevância</SelectItem>
                        <SelectItem value="name">Nome</SelectItem>
                        <SelectItem value="category">Categoria</SelectItem>
                        <SelectItem value="family">Família</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Active Filters Chips */}
                  {getOilActiveChips().length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Filtros ativos</h4>
                      <div className="flex flex-wrap gap-2">
                        {getOilActiveChips().map((chip) => (
                          <Badge
                            key={chip.stableKey}
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => removeOilFilter(chip.key, chip.value)}
                          >
                            {chip.label}
                            <X className="ml-1 h-3 w-3" />
                          </Badge>
                        ))}
                      </div>
                      <Button variant="outline" size="sm" onClick={clearOilFilters}>
                        Limpar todos os filtros
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome (PT)</TableHead>
                      <TableHead>Nome Latim</TableHead>
                      <TableHead>Família Botânica</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOils.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                          {oilsSearch ? 'Nenhum óleo encontrado' : 'Nenhum óleo cadastrado'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredOils.map((oil) => (
                        <TableRow key={oil.id}>
                          <TableCell className="font-medium">{oil.nome_pt}</TableCell>
                          <TableCell className="italic">{oil.nome_latim || '—'}</TableCell>
                          <TableCell>{oil.familia_botanica || '—'}</TableCell>
                          <TableCell>{oil.tipo_produto}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditOil(oil)}
                                aria-label={`Editar ${oil.nome_pt}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteOilId(oil.id)}
                                aria-label={`Excluir ${oil.nome_pt}`}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recipes" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  Receitas
                  <Badge variant="secondary" aria-live="polite">
                    {filteredRecipes.length} de {recipesRoot?.recipes.length || 0} itens
                  </Badge>
                </CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleExportRecipes}
                    disabled={exportingRecipes}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {exportingRecipes ? 'Exportando...' : 'Exportar'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openImportDialog('recipes')}>
                    <Upload className="w-4 h-4 mr-2" />
                    Importar
                  </Button>
                  <Button onClick={handleCreateRecipe}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nova
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Intenções rápidas */}
              <Card>
                <CardContent className="p-6">
                  <div className="mb-4">
                    <h3 className="text-sm font-medium mb-2">Intenções</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(RECIPE_INTENT_TERMS).map(intent => (
                        <Button
                          key={intent}
                          variant={recipeFilters.intents?.includes(intent) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleRecipeArrayFilter('intents', intent)}
                          className="text-xs"
                        >
                          {intent}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Busca */}
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      inputMode="search"
                      enterKeyHint="search"
                      aria-label="Buscar receitas por nome, propósito, aplicação, ingrediente ou tag"
                      placeholder="Buscar receitas…"
                      value={recipesSearch}
                      onChange={(e) => setRecipesSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && recipesSearch !== recipeFilters.q) {
                          setRecipeFilters(prev => ({ ...prev, q: recipesSearch }));
                        }
                      }}
                      className="pl-10 pr-10"
                    />
                    {recipesSearch && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1 h-8 w-8"
                        onClick={() => {
                          setRecipesSearch("");
                          setRecipeFilters(prev => ({ ...prev, q: "" }));
                        }}
                        aria-label="Limpar busca"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Ordenação */}
                  <div className="grid md:grid-cols-5 gap-4">
                    <Select 
                      value={recipeFilters.sort || "relevance"} 
                      onValueChange={(v) => setRecipeFilters(prev => ({ ...prev, sort: v as RecipeFilters["sort"] }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Ordenar por" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Relevância</SelectItem>
                        <SelectItem value="name">Nome</SelectItem>
                        <SelectItem value="application">Aplicação</SelectItem>
                        <SelectItem value="difficulty">Dificuldade</SelectItem>
                        <SelectItem value="prep_time">Tempo de preparo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Filtros avançados */}
              <Card>
                <CardContent className="p-6">
                  <Accordion type="multiple" className="w-full">
                    {/* Propriedades */}
                    <AccordionItem value="properties">
                      <AccordionTrigger className="text-sm font-medium">Propriedades da Receita</AccordionTrigger>
                      <AccordionContent>
                        <div className="grid md:grid-cols-3 gap-4">
                          {/* Aplicação */}
                          <div>
                            <h5 className="font-medium mb-2 text-sm">Aplicação</h5>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {(recipeFacetCounts.application || []).map(item => (
                                <div key={item.value} className="flex items-center space-x-2">
                                  <Checkbox
                                    checked={recipeFilters.application?.includes(item.value)}
                                    onCheckedChange={() => toggleRecipeArrayFilter('application', item.value)}
                                  />
                                  <label className="text-sm cursor-pointer">
                                    {item.value} <span className="text-muted-foreground">({item.count})</span>
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Dificuldade */}
                          <div>
                            <h5 className="font-medium mb-2 text-sm">Dificuldade</h5>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {(recipeFacetCounts.difficulty || []).map(item => (
                                <div key={item.value} className="flex items-center space-x-2">
                                  <Checkbox
                                    checked={recipeFilters.difficulty?.includes(item.value)}
                                    onCheckedChange={() => toggleRecipeArrayFilter('difficulty', item.value)}
                                  />
                                  <label className="text-sm cursor-pointer">
                                    {item.value} <span className="text-muted-foreground">({item.count})</span>
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Tags */}
                          <div>
                            <h5 className="font-medium mb-2 text-sm">Tags</h5>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {(recipeFacetCounts.tags || []).slice(0, 10).map(item => (
                                <div key={item.value} className="flex items-center space-x-2">
                                  <Checkbox
                                    checked={recipeFilters.tags?.includes(item.value)}
                                    onCheckedChange={() => toggleRecipeArrayFilter('tags', item.value)}
                                  />
                                  <label className="text-sm cursor-pointer">
                                    {item.value} <span className="text-muted-foreground">({item.count})</span>
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Ingredientes */}
                    <AccordionItem value="ingredients">
                      <AccordionTrigger className="text-sm font-medium">Ingredientes</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {(recipeFacetCounts.ingredients || []).slice(0, 20).map(item => (
                            <div key={item.value} className="flex items-center space-x-2">
                              <Checkbox
                                checked={recipeFilters.ingredients?.includes(item.value)}
                                onCheckedChange={() => toggleRecipeArrayFilter('ingredients', item.value)}
                              />
                              <label className="text-sm cursor-pointer">
                                {item.value} <span className="text-muted-foreground">({item.count})</span>
                              </label>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Segurança */}
                    <AccordionItem value="safety">
                      <AccordionTrigger className="text-sm font-medium">Critérios de Segurança</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          {[
                            { key: "evitar_epilepsia", label: "Evitar em epilepsia" },
                            { key: "cautela_asma", label: "Cautela em asma" },
                            { key: "no_gravidez", label: "Sem menção de gravidez" },
                            { key: "no_pediatrico", label: "Sem menção pediátrica" },
                            { key: "evitar_fototoxico_leaveon", label: "Evitar fotossensibilizantes" }
                          ].map(({ key, label }) => (
                            <div key={key} className="flex items-center space-x-2">
                              <Checkbox
                                checked={recipeFilters.safety?.includes(key as any)}
                                onCheckedChange={(checked) => {
                                  const current = recipeFilters.safety || [];
                                  const updated = checked 
                                    ? [...current, key as any]
                                    : current.filter(s => s !== key);
                                  setRecipeFilters(prev => ({ ...prev, safety: updated }));
                                }}
                              />
                              <label className="text-sm cursor-pointer">{label}</label>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Tempo de preparo */}
                    <AccordionItem value="preptime">
                      <AccordionTrigger className="text-sm font-medium">Tempo de Preparo</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          {[
                            { key: "lte5", label: "≤5 min" },
                            { key: "btw6_10", label: "6-10 min" },
                            { key: "gt10", label: ">10 min" }
                          ].map(({ key, label }) => (
                            <div key={key} className="flex items-center space-x-2">
                              <Checkbox
                                checked={recipeFilters.prepRange?.includes(key as any)}
                                onCheckedChange={(checked) => {
                                  const current = recipeFilters.prepRange || [];
                                  const updated = checked 
                                    ? [...current, key as any]
                                    : current.filter(p => p !== key);
                                  setRecipeFilters(prev => ({ ...prev, prepRange: updated }));
                                }}
                              />
                              <label className="text-sm cursor-pointer">{label}</label>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Diluição */}
                    <AccordionItem value="dilution">
                      <AccordionTrigger className="text-sm font-medium">Diluição</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          {[
                            { key: "no_pct", label: "Sem %" },
                            { key: "lte1", label: "≤1%" },
                            { key: "eq2", label: "~2%" },
                            { key: "gt2", label: ">2%" }
                          ].map(({ key, label }) => (
                            <div key={key} className="flex items-center space-x-2">
                              <Checkbox
                                checked={recipeFilters.dilution?.includes(key as any)}
                                onCheckedChange={(checked) => {
                                  const current = recipeFilters.dilution || [];
                                  const updated = checked 
                                    ? [...current, key as any]
                                    : current.filter(d => d !== key);
                                  setRecipeFilters(prev => ({ ...prev, dilution: updated }));
                                }}
                              />
                              <label className="text-sm cursor-pointer">{label}</label>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Metadados */}
                    <AccordionItem value="metadata">
                      <AccordionTrigger className="text-sm font-medium">Metadados</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          {[
                            { key: "has_contra", label: "Possui contraindicações" },
                            { key: "has_refs", label: "Possui referências" }
                          ].map(({ key, label }) => (
                            <div key={key} className="flex items-center space-x-2">
                              <Checkbox
                                checked={recipeFilters.meta?.includes(key as any)}
                                onCheckedChange={(checked) => {
                                  const current = recipeFilters.meta || [];
                                  const updated = checked 
                                    ? [...current, key as any]
                                    : current.filter(m => m !== key);
                                  setRecipeFilters(prev => ({ ...prev, meta: updated }));
                                }}
                              />
                              <label className="text-sm cursor-pointer">{label}</label>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  {/* Filtros ativos */}
                  {(recipeFilters.intents?.length || recipeFilters.application?.length || recipeFilters.difficulty?.length || 
                    recipeFilters.tags?.length || recipeFilters.ingredients?.length || recipeFilters.safety?.length ||
                    recipeFilters.prepRange?.length || recipeFilters.dilution?.length || recipeFilters.meta?.length) && (
                    <div className="mt-6 pt-4 border-t">
                      <h4 className="font-medium mb-3 text-sm">Filtros ativos</h4>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {recipeFilters.intents?.map(v => (
                          <Badge key={`intent-${v}`} variant="secondary" className="cursor-pointer" 
                            onClick={() => toggleRecipeArrayFilter('intents', v)}>
                            {v} <X className="ml-1 h-3 w-3" />
                          </Badge>
                        ))}
                        {recipeFilters.application?.map(v => (
                          <Badge key={`app-${v}`} variant="secondary" className="cursor-pointer" 
                            onClick={() => toggleRecipeArrayFilter('application', v)}>
                            App: {v} <X className="ml-1 h-3 w-3" />
                          </Badge>
                        ))}
                        {recipeFilters.difficulty?.map(v => (
                          <Badge key={`diff-${v}`} variant="secondary" className="cursor-pointer"
                            onClick={() => toggleRecipeArrayFilter('difficulty', v)}>
                            Dif: {v} <X className="ml-1 h-3 w-3" />
                          </Badge>
                        ))}
                        {recipeFilters.tags?.map(v => (
                          <Badge key={`tag-${v}`} variant="secondary" className="cursor-pointer"
                            onClick={() => toggleRecipeArrayFilter('tags', v)}>
                            Tag: {v} <X className="ml-1 h-3 w-3" />
                          </Badge>
                        ))}
                        {recipeFilters.ingredients?.map(v => (
                          <Badge key={`ing-${v}`} variant="secondary" className="cursor-pointer"
                            onClick={() => toggleRecipeArrayFilter('ingredients', v)}>
                            Ing: {v} <X className="ml-1 h-3 w-3" />
                          </Badge>
                        ))}
                      </div>
                      <Button variant="outline" size="sm" onClick={clearRecipeFilters}>
                        Limpar todos os filtros
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Aplicação</TableHead>
                      <TableHead>Dificuldade</TableHead>
                      <TableHead>Tempo</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecipes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                          {recipesSearch ? 'Nenhuma receita encontrada' : 'Nenhuma receita cadastrada'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRecipes.map((recipe) => (
                        <TableRow key={recipe.id}>
                          <TableCell className="font-medium">{recipe.name}</TableCell>
                          <TableCell>{recipe.application}</TableCell>
                          <TableCell>{recipe.difficulty}</TableCell>
                          <TableCell>{recipe.prep_time || '—'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditRecipe(recipe)}
                                aria-label={`Editar ${recipe.name}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteRecipeId(String(recipe.id))}
                                aria-label={`Excluir ${recipe.name}`}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>

        {/* Dialog de importação */}
        <ImportDialog
          open={importDialogOpen}
          onClose={() => setImportDialogOpen(false)}
          type={importType}
          currentData={importType === 'oils' ? oils : { recipes: recipesRoot?.recipes || [] }}
          onImport={importType === 'oils' ? handleImportOils : handleImportRecipes}
          onExportBackup={importType === 'oils' ? handleExportOils : handleExportRecipes}
        />

        {/* Formulário de óleo */}
        {isOilFormOpen && (
          <OilForm
            oil={selectedOil as Oil}
            onSave={handleSaveOil}
            onCancel={() => checkExitConfirm(() => {
              setIsOilFormOpen(false);
              setSelectedOil(null);
              setIsOilDirty(false);
            })}
            onDirtyChange={setIsOilDirty}
          />
        )}

        {/* Formulário de receita */}
        {isRecipeFormOpen && (
          <RecipeForm
            recipe={selectedRecipe as Recipe}
            onSave={handleSaveRecipe}
            onCancel={() => checkExitConfirm(() => {
              setIsRecipeFormOpen(false);
              setSelectedRecipe(null);
              setIsRecipeDirty(false);
            })}
            onDirtyChange={setIsRecipeDirty}
          />
        )}

        {/* Import Dialog */}
        <ImportDialog 
          open={importDialogOpen} 
          onClose={() => setImportDialogOpen(false)}
          type={importType}
          currentData={importType === 'oils' ? oils : { recipes: recipesRoot?.recipes || [] }}
          onImport={importType === 'oils' ? handleImportOils : handleImportRecipes}
          onExportBackup={importType === 'oils' ? handleExportOils : handleExportRecipes}
        />
        
        {/* Save Confirmation Dialog */}
        <AlertDialog open={saveConfirmOpen} onOpenChange={setSaveConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Deseja salvar as alterações?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja salvar as alterações realizadas?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSaveConfirmOpen(false)}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  setSaveConfirmOpen(false);
                  if (pendingAction) {
                    await pendingAction();
                    setPendingAction(null);
                  }
                }}
              >
                Salvar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Exit Confirmation Dialog */}
        <AlertDialog open={exitConfirmOpen} onOpenChange={setExitConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Há alterações não salvas</AlertDialogTitle>
              <AlertDialogDescription>
                Você tem alterações não salvas. Deseja salvar antes de sair?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setExitConfirmOpen(false)}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setExitConfirmOpen(false);
                  if (activeTab === 'oils') setIsOilDirty(false);
                  else setIsRecipeDirty(false);
                  if (pendingAction) {
                    pendingAction();
                    setPendingAction(null);
                  }
                }}
              >
                Descartar
              </AlertDialogAction>
              <AlertDialogAction
                onClick={async () => {
                  setExitConfirmOpen(false);
                  if (pendingAction) {
                    pendingAction();
                    setPendingAction(null);
                  }
                }}
              >
                Salvar e Sair
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Confirmação de exclusão - Óleo */}
        <AlertDialog open={!!deleteOilId} onOpenChange={() => setDeleteOilId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este óleo? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deleteOilId && handleDeleteOil(deleteOilId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Confirmação de exclusão - Receita */}
        <AlertDialog open={!!deleteRecipeId} onOpenChange={() => setDeleteRecipeId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta receita? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deleteRecipeId && handleDeleteRecipe(deleteRecipeId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Catalogo;