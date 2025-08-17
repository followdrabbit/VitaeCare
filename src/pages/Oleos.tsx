import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { Search, X, AlertTriangle, Leaf, Beaker, Eye, Heart, Brain, Shield, Loader2, BookOpen, Calculator } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { BlendCalculator } from "@/components/BlendCalculator";
import { loadOils } from "@/services/dataStore";
import { onChange } from "@/lib/bus";

// Types
type Constituinte = { nome: string; percentual?: number | null };
type Diluicoes = { geral?: string | null; valores_percent?: number[] | null };

type Oil = {
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
  principais_constituintes?: Constituinte[];
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
  diluicoes?: Diluicoes | null;
  sinergias_sugeridas?: string[];
  incompatibilidades_praticas?: string[];
  fontes?: Array<{ url?: string; ref?: string }>;
};

type Filters = {
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

// Normalization and intent mapping
const norm = (s?: string|null) => (s||"").normalize("NFD").replace(/\p{Diacritic}/gu,"").toLowerCase();

const INTENT_TERMS: Record<string,string[]> = {
  "Relaxamento/Ansiedade": ["ansiedad","relax","calma","estresse","tensao","nervos","stress"],
  "Sono/Insônia": ["sono","insônia","insonia","dormir","adormecer","descanso"],
  "Foco/Concentração": ["foco","concentracao","aten","cognit","mental","memoria"],
  "Respiratório": ["respirat","tosse","resfri","rinite","sinus","bronq","congest","gripe"],
  "Pele/Sensível": ["dermat","pele","sensivel","sensível","cicatriz","acne","eczema","psorias"],
  "Muscular/Dor": ["muscul","dor","mialg","espasmo","analges","articulac","rigidez"],
  "Antisséptico/Antimicrobiano": ["antissep","antimicrob","antibac","antifung","desinfet","purific"]
};

const Oleos = () => {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Data loading state
  const [items, setItems] = useState<Oil[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOil, setSelectedOil] = useState<Oil | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  // Filter state from URL params (robust multiple parameter reading)
  const [filters, setFilters] = useState<Filters>(() => ({
    q: searchParams.get('q') || '',
    intents: searchParams.getAll('intents'),
    apps: searchParams.getAll('apps'),
    safe: searchParams.getAll('safe') as Filters['safe'],
    publics: searchParams.getAll('publics') as Filters['publics'],
    constituintes: searchParams.getAll('constituintes'),
    tipo: searchParams.getAll('tipo'),
    famBot: searchParams.getAll('famBot'),
    famOlf: searchParams.getAll('famOlf'),
    parte: searchParams.getAll('parte'),
    metodo: searchParams.getAll('metodo'),
    veiculos: searchParams.getAll('veiculos'),
    regiao: searchParams.getAll('regiao'),
    sort: (searchParams.get('sort') as Filters['sort']) || 'relevance'
  }));
  
  const [searchInput, setSearchInput] = useState(filters.q || '');
  const [constituentesSearch, setConstituentesSearch] = useState('');

  // Carregamento via dataStore
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadOils();
      setItems(data);
    } catch (e: any) {
      setError("Não foi possível carregar os dados.");
      setItems([]);
      console.error("Erro ao carregar dados:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Data loading
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Listen for data changes
  useEffect(() => {
    const off = onChange((c) => {
      if (c.type === "oils") loadData();
    });
    return off;
  }, [loadData]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.q) {
        updateFilters({ q: searchInput });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Update URL when filters change (functional setState + robust array handling)
  const updateFilters = useCallback((patch: Partial<Filters>) => {
    setFilters(prev => {
      const updated: Filters = { ...prev, ...patch };

      // Build robust querystring with multiple parameters per key
      const params = new URLSearchParams();
      const setParam = (k: string, v?: string | string[]) => {
        if (!v || (Array.isArray(v) && v.length === 0)) return;
        if (Array.isArray(v)) v.forEach(val => params.append(k, val));
        else params.set(k, v);
      };

      setParam("q", updated.q);
      setParam("intents", updated.intents);
      setParam("apps", updated.apps);
      setParam("safe", updated.safe);
      setParam("publics", updated.publics);
      setParam("constituintes", updated.constituintes);
      setParam("tipo", updated.tipo);
      setParam("famBot", updated.famBot);
      setParam("famOlf", updated.famOlf);
      setParam("parte", updated.parte);
      setParam("metodo", updated.metodo);
      setParam("veiculos", updated.veiculos);
      setParam("regiao", updated.regiao);
      setParam("sort", updated.sort);

      setSearchParams(params, { replace: true });
      return updated;
    });
  }, [setSearchParams]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    const cleared: Filters = { sort: 'relevance' };
    setFilters(cleared);
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  // Utility functions for filtering
  const matchesAny = useCallback(<T,>(itemVals: T[]|undefined, selected: T[]|undefined, proj:(v:T)=>string = v=>String(v)): boolean => {
    if (!selected || selected.length===0) return true;
    const set = new Set(selected.map(v=>norm(String(v))));
    return (itemVals||[]).some(v => set.has(norm(proj(v))));
  }, []);

  // Apply filters logic
  const applyFilters = useCallback((data: Oil[], f: Filters): { rows: Oil[]; score: Map<string, number> } => {
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
        ok = typeof min === "number" ? min <= 3 : false; // unknown excludes
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
      ok = ok && matchesAny([o.familia_olfativa_raw||o.familia_olfativa||""], f.famOlf);
      ok = ok && matchesAny([o.parte_usada||""], f.parte);
      ok = ok && matchesAny([o.metodo_extracao_raw||o.metodo_extracao||""], f.metodo);
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

  // Calculate facet counts (safe with empty items array)
  const facetCounts = useMemo(() => {
    const out: Record<string, Array<{value:string; count:number}>> = {};
    
    // Safe fallback for empty or missing items
    if (!items || !items.length) {
      return {
        apps: [], tipo: [], famBot: [], famOlf: [], parte: [], 
        metodo: [], veiculos: [], regiao: [], constituintes: []
      };
    }
    
    const facets = [
      ["apps", (o: Oil) => o.aplicacoes_sugeridas||[]],
      ["tipo", (o: Oil) => o.tipo_produto?[o.tipo_produto]:[]],
      ["famBot", (o: Oil) => o.familia_botanica?[o.familia_botanica]:[]],
      ["famOlf", (o: Oil) => [o.familia_olfativa_raw||o.familia_olfativa||""].filter(Boolean) as string[]],
      ["parte", (o: Oil) => o.parte_usada?[o.parte_usada]:[]],
      ["metodo", (o: Oil) => [o.metodo_extracao_raw||o.metodo_extracao||""].filter(Boolean) as string[]],
      ["veiculos", (o: Oil) => o.veiculos_recomendados||[]],
      ["regiao", (o: Oil) => o.regiao_origem?[o.regiao_origem]:[]],
      ["constituintes", (o: Oil) => (o.principais_constituintes||[]).map(c=>c.nome)]
    ] as const;
    
    for (const [key, proj] of facets) {
      const f2 = { ...filters, [key]: [] };
      const subset = applyFilters(items, f2).rows;
      const map = new Map<string, number>();
      subset.forEach(o => proj(o).forEach(v => map.set(v, (map.get(v)||0)+1)));
      out[key] = [...map.entries()].sort((a,b)=> b[1]-a[1]).map(([value,count])=>({value, count}));
    }
    return out;
  }, [items, filters, applyFilters]);

  // Apply current filters (memoized, safe with empty items)
  const filteredProducts = useMemo(() => {
    const { rows } = applyFilters(items || [], filters);
    return rows;
  }, [items, filters, applyFilters]);

  // Get top constituents for filter
  const topConstituents = useMemo(() => {
    const filtered = constituentesSearch ? 
      (facetCounts.constituintes || []).filter(c => 
        norm(c.value).includes(norm(constituentesSearch))
      ) : 
      (facetCounts.constituintes || []).slice(0, 20);
    return filtered;
  }, [facetCounts.constituintes, constituentesSearch]);

  // Array filter toggle helper
  const toggleArrayFilter = useCallback((key: keyof Filters, value: string) => {
    const current = filters[key] as string[] || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    updateFilters({ [key]: updated });
  }, [filters, updateFilters]);

  // Remove filter helper
  const removeFilter = useCallback((key: string, value?: string) => {
    if (key === 'q') {
      setSearchInput('');
      updateFilters({ q: '' });
    } else if (value) {
      toggleArrayFilter(key as keyof Filters, value);
    }
  }, [toggleArrayFilter, updateFilters]);

  // Utility functions
  function formatMetodoExtracao(o: Oil) {
    if (o.metodo_extracao_raw) return o.metodo_extracao_raw;
    const map: Record<string, string> = {
      steam_distillation: "Destilação a vapor",
      expression: "Prensagem a frio",
      solvent: "Solvente",
      co2: "CO₂",
      hydrodistillation: "Hidrodestilação"
    };
    return o.metodo_extracao ? (map[o.metodo_extracao] ?? o.metodo_extracao) : "-";
  }

  function formatFamiliaOlfativa(o: Oil) {
    return o.familia_olfativa_raw ?? (o.familia_olfativa ? (o.familia_olfativa[0].toUpperCase() + o.familia_olfativa.slice(1)) : "-");
  }

  function formatConstituintes(list?: Constituinte[]) {
    if (!list || !list.length) return [];
    return list.map(c => c.percentual != null ? `${c.nome} (${c.percentual}%)` : c.nome);
  }

  function splitBullets(s?: string | null): string[] {
    if (!s) return [];
    const semi = s.split(/;/).map(x => x.trim()).filter(Boolean);
    if (semi.length > 1) return semi;
    return s.split(/\.\s+/).map(x => x.trim()).filter(Boolean);
  }

  function safetyDot(v?: boolean | null) {
    if (v === true) return "bg-green-500";
    if (v === false) return "bg-gray-400";
    return "bg-yellow-500";
  }

  function formatSafety(v?: boolean | null) {
    if (v === true) return "Seguro";
    if (v === false) return "Não recomendado";
    return "Cautela";
  }

  function getVisuals(o: Oil) {
    const fam = (o.familia_olfativa_raw || o.familia_olfativa || "").toLowerCase();
    if (fam.includes("flor")) return { Icon: Heart, color: "bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400" };
    if (fam.includes("cítric") || fam.includes("citr")) return { Icon: Brain, color: "bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400" };
    if (fam.includes("herb") || fam.includes("arom")) return { Icon: Leaf, color: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400" };
    if (fam.includes("resin") || fam.includes("amadeir")) return { Icon: Beaker, color: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" };
    return { Icon: Shield, color: "bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-300" };
  }

  // Handle oil details modal
  const openDetails = useCallback((oil: Oil) => {
    setSelectedOil(oil);
    setDetailsOpen(true);
  }, []);

  const closeDetails = useCallback(() => {
    setSelectedOil(null);
    setDetailsOpen(false);
  }, []);

  // Get active filter chips (with stable keys)
  const getActiveChips = useCallback(() => {
    const chips: Array<{label: string; key: string; value?: string; stableKey: string}> = [];
    
    if (filters.q) chips.push({label: `"${filters.q}"`, key: 'q', stableKey: 'q'});
    
    filters.intents?.forEach(intent => 
      chips.push({label: intent, key: 'intents', value: intent, stableKey: `intents:${intent}`}));
    
    filters.apps?.forEach(app => 
      chips.push({label: 'App: ' + app, key: 'apps', value: app, stableKey: `apps:${app}`}));
    
    if (filters.safe?.includes("pele")) chips.push({label: "Seguro p/ pele sensível", key: 'safe', value: 'pele', stableKey: 'safe:pele'});
    if (filters.safe?.includes("clinico")) chips.push({label: "Seguro p/ ambiente clínico", key: 'safe', value: 'clinico', stableKey: 'safe:clinico'});
    if (filters.safe?.includes("nao_fototoxico")) chips.push({label: "Não fototóxico", key: 'safe', value: 'nao_fototoxico', stableKey: 'safe:nao_fototoxico'});
    if (filters.safe?.includes("baixa_sensibilizacao")) chips.push({label: "Baixo risco de sensibilização", key: 'safe', value: 'baixa_sensibilizacao', stableKey: 'safe:baixa_sensibilizacao'});
    
    if (filters.publics?.includes("sem_gravidez")) chips.push({label: "Evitar gravidez", key: 'publics', value: 'sem_gravidez', stableKey: 'publics:sem_gravidez'});
    if (filters.publics?.includes("sem_lactacao")) chips.push({label: "Evitar lactação", key: 'publics', value: 'sem_lactacao', stableKey: 'publics:sem_lactacao'});
    if (filters.publics?.includes("criancas3")) chips.push({label: "Seguro para crianças 3+", key: 'publics', value: 'criancas3', stableKey: 'publics:criancas3'});
    if (filters.publics?.includes("evitar_epilepsia")) chips.push({label: "Evitar epilepsia", key: 'publics', value: 'evitar_epilepsia', stableKey: 'publics:evitar_epilepsia'});
    if (filters.publics?.includes("evitar_asma")) chips.push({label: "Evitar asma", key: 'publics', value: 'evitar_asma', stableKey: 'publics:evitar_asma'});
    
    filters.constituintes?.forEach(c => 
      chips.push({label: 'Constituinte: ' + c, key: 'constituintes', value: c, stableKey: `constituintes:${c}`}));
    
    filters.tipo?.forEach(t => 
      chips.push({label: 'Tipo: ' + t, key: 'tipo', value: t, stableKey: `tipo:${t}`}));
    
    filters.famBot?.forEach(f => 
      chips.push({label: 'Família: ' + f, key: 'famBot', value: f, stableKey: `famBot:${f}`}));
    
    filters.famOlf?.forEach(f => 
      chips.push({label: 'Olfativa: ' + f, key: 'famOlf', value: f, stableKey: `famOlf:${f}`}));
    
    filters.parte?.forEach(p => 
      chips.push({label: 'Parte: ' + p, key: 'parte', value: p, stableKey: `parte:${p}`}));
    
    filters.metodo?.forEach(m => 
      chips.push({label: 'Método: ' + m, key: 'metodo', value: m, stableKey: `metodo:${m}`}));
    
    filters.veiculos?.forEach(v => 
      chips.push({label: 'Veículo: ' + v, key: 'veiculos', value: v, stableKey: `veiculos:${v}`}));
    
    filters.regiao?.forEach(r => 
      chips.push({label: 'Região: ' + r, key: 'regiao', value: r, stableKey: `regiao:${r}`}));
    
    return chips;
  }, [filters]);

  const activeChips = getActiveChips();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 space-y-6 max-w-7xl">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Lista de Óleos Essenciais Disponíveis
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Óleos essenciais para organização de dados.
            Os dados dos óleos são de responsabilidade exclusiva de quem os cadastra e utiliza.
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="informacoes" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="informacoes" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Informações sobre Óleos
            </TabsTrigger>
            <TabsTrigger value="calculadora" className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Blends com Oleos Essenciais
            </TabsTrigger>
          </TabsList>

          {/* Aba de Informações */}
          <TabsContent value="informacoes" className="space-y-6">

        {/* FILTROS ORGANIZADOS POR CATEGORIA */}
        <div className="mb-8 space-y-6">
          {/* 1. BUSCA E INTENÇÕES (Principal) */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Search className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Busca e Intenções</h3>
              </div>
              
              {/* Barra de Pesquisa - SEMPRE VISÍVEL */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  {searchInput !== filters.q && (
                    <Loader2 className="absolute right-10 top-3 h-4 w-4 text-muted-foreground animate-spin" />
                  )}
                  <Input
                    type="search"
                    inputMode="search"
                    enterKeyHint="search"
                    aria-label="Buscar óleos essenciais por nome, efeito, aplicação ou constituinte"
                    placeholder="Busque por nome, sintoma/efeito, aplicação ou constituinte..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && searchInput !== filters.q) {
                        updateFilters({ q: searchInput });
                      }
                    }}
                    className="pl-10 pr-12 h-12 text-base"
                  />
                  {searchInput && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-2 h-8 w-8"
                      onClick={() => {
                        setSearchInput('');
                        updateFilters({ q: '' });
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Intenções Rápidas - Grid responsivo */}
              <div>
                <h4 className="text-sm font-medium mb-3 text-muted-foreground">Intenções terapêuticas comuns:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {Object.keys(INTENT_TERMS).map(intent => (
                    <Button
                      key={intent}
                      variant={filters.intents?.includes(intent) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        const current = filters.intents || [];
                        const updated = current.includes(intent) 
                          ? current.filter(i => i !== intent)
                          : [...current, intent];
                        updateFilters({ intents: updated });
                      }}
                      className="text-xs h-8 justify-start"
                    >
                      {intent}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. SEGURANÇA E PÚBLICO */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Segurança</h3>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Critérios de Segurança */}
                <div>
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground">Critérios de segurança:</h4>
                  <div className="space-y-2">
                    {[
                      { key: "pele", label: "Seguro para pele sensível" },
                      { key: "clinico", label: "Seguro para uso clínico" },
                      { key: "nao_fototoxico", label: "Não fototóxico" },
                      { key: "baixa_sensibilizacao", label: "Baixo risco de sensibilização" }
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center space-x-2 cursor-pointer">
                        <Checkbox
                          checked={filters.safe?.includes(key as any) || false}
                          onCheckedChange={(checked) => {
                            const current = filters.safe || [];
                            const updated = checked
                              ? [...current, key as any]
                              : current.filter((s: string) => s !== key);
                            updateFilters({ safe: updated });
                          }}
                        />
                        <span className="text-sm">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Restrições por Público */}
                <div>
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground">Condições especiais:</h4>
                  <div className="space-y-2">
                    {[
                      { key: "sem_gravidez", label: "Seguro na gravidez" },
                      { key: "sem_lactacao", label: "Seguro na lactação" },
                      { key: "criancas3", label: "Seguro para crianças 3+" },
                      { key: "evitar_epilepsia", label: "Cuidado com epilepsia" },
                      { key: "evitar_asma", label: "Cuidado com asma" }
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center space-x-2 cursor-pointer">
                        <Checkbox
                          checked={filters.publics?.includes(key as any) || false}
                          onCheckedChange={(checked) => {
                            const current = filters.publics || [];
                            const updated = checked
                              ? [...current, key as any]
                              : current.filter((s: string) => s !== key);
                            updateFilters({ publics: updated });
                          }}
                        />
                        <span className="text-sm">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. FILTROS AVANÇADOS (Collapsible) */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="advanced-filters" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-2">
                  <Beaker className="h-5 w-5 text-primary" />
                  <span className="text-lg font-semibold">Filtros Avançados</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  
                  {/* Aplicações */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">Aplicações ({facetCounts.apps?.length || 0})</h4>
                    <div className="max-h-48 overflow-y-auto space-y-1 border rounded p-2">
                      {(facetCounts.apps || []).slice(0, 15).map(({ value, count }) => (
                        <label key={value} className="flex items-center justify-between text-sm cursor-pointer hover:bg-muted/50 px-2 py-1 rounded">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <Checkbox
                              checked={filters.apps?.includes(value) || false}
                              onCheckedChange={() => toggleArrayFilter('apps', value)}
                            />
                            <span className="truncate">{value}</span>
                          </div>
                          <Badge variant="secondary" className="ml-2 text-xs">{count}</Badge>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Constituintes Químicos */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">Constituintes ({facetCounts.constituintes?.length || 0})</h4>
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                        <Input
                          placeholder="Buscar constituinte..."
                          value={constituentesSearch}
                          onChange={(e) => setConstituentesSearch(e.target.value)}
                          className="pl-7 h-8 text-xs"
                        />
                      </div>
                      <div className="max-h-40 overflow-y-auto space-y-1 border rounded p-2">
                        {topConstituents.map(({ value, count }) => (
                          <label key={value} className="flex items-center justify-between text-sm cursor-pointer hover:bg-muted/50 px-2 py-1 rounded">
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              <Checkbox
                                checked={filters.constituintes?.includes(value) || false}
                                onCheckedChange={() => toggleArrayFilter('constituintes', value)}
                              />
                              <span className="truncate text-xs">{value}</span>
                            </div>
                            <Badge variant="secondary" className="ml-2 text-xs">{count}</Badge>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Taxonomia Botânica */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">Taxonomia</h4>
                    <div className="space-y-3">
                      
                      {/* Tipo de Produto */}
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Tipo ({facetCounts.tipo?.length || 0})</label>
                        <div className="max-h-20 overflow-y-auto space-y-1 border rounded p-1">
                          {(facetCounts.tipo || []).map(({ value, count }) => (
                            <label key={value} className="flex items-center justify-between text-xs cursor-pointer hover:bg-muted/50 px-1 py-0.5 rounded">
                              <div className="flex items-center space-x-1 flex-1 min-w-0">
                                <Checkbox
                                  checked={filters.tipo?.includes(value) || false}
                                  onCheckedChange={() => toggleArrayFilter('tipo', value)}
                                />
                                <span className="truncate">{value}</span>
                              </div>
                              <Badge variant="secondary" className="ml-1 text-xs">{count}</Badge>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Família Botânica */}
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Família Botânica ({facetCounts.famBot?.length || 0})</label>
                        <div className="max-h-20 overflow-y-auto space-y-1 border rounded p-1">
                          {(facetCounts.famBot || []).slice(0, 8).map(({ value, count }) => (
                            <label key={value} className="flex items-center justify-between text-xs cursor-pointer hover:bg-muted/50 px-1 py-0.5 rounded">
                              <div className="flex items-center space-x-1 flex-1 min-w-0">
                                <Checkbox
                                  checked={filters.famBot?.includes(value) || false}
                                  onCheckedChange={() => toggleArrayFilter('famBot', value)}
                                />
                                <span className="truncate">{value}</span>
                              </div>
                              <Badge variant="secondary" className="ml-1 text-xs">{count}</Badge>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Família Olfativa */}
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Família Olfativa ({facetCounts.famOlf?.length || 0})</label>
                        <div className="max-h-20 overflow-y-auto space-y-1 border rounded p-1">
                          {(facetCounts.famOlf || []).map(({ value, count }) => (
                            <label key={value} className="flex items-center justify-between text-xs cursor-pointer hover:bg-muted/50 px-1 py-0.5 rounded">
                              <div className="flex items-center space-x-1 flex-1 min-w-0">
                                <Checkbox
                                  checked={filters.famOlf?.includes(value) || false}
                                  onCheckedChange={() => toggleArrayFilter('famOlf', value)}
                                />
                                <span className="truncate">{value}</span>
                              </div>
                              <Badge variant="secondary" className="ml-1 text-xs">{count}</Badge>
                            </label>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Produção */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">Produção</h4>
                    <div className="space-y-3">
                      
                      {/* Parte Usada */}
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Parte Usada ({facetCounts.parte?.length || 0})</label>
                        <div className="max-h-20 overflow-y-auto space-y-1 border rounded p-1">
                          {(facetCounts.parte || []).map(({ value, count }) => (
                            <label key={value} className="flex items-center justify-between text-xs cursor-pointer hover:bg-muted/50 px-1 py-0.5 rounded">
                              <div className="flex items-center space-x-1 flex-1 min-w-0">
                                <Checkbox
                                  checked={filters.parte?.includes(value) || false}
                                  onCheckedChange={() => toggleArrayFilter('parte', value)}
                                />
                                <span className="truncate">{value}</span>
                              </div>
                              <Badge variant="secondary" className="ml-1 text-xs">{count}</Badge>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Método de Extração */}
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Método Extração ({facetCounts.metodo?.length || 0})</label>
                        <div className="max-h-20 overflow-y-auto space-y-1 border rounded p-1">
                          {(facetCounts.metodo || []).map(({ value, count }) => (
                            <label key={value} className="flex items-center justify-between text-xs cursor-pointer hover:bg-muted/50 px-1 py-0.5 rounded">
                              <div className="flex items-center space-x-1 flex-1 min-w-0">
                                <Checkbox
                                  checked={filters.metodo?.includes(value) || false}
                                  onCheckedChange={() => toggleArrayFilter('metodo', value)}
                                />
                                <span className="truncate">{value}</span>
                              </div>
                              <Badge variant="secondary" className="ml-1 text-xs">{count}</Badge>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Veículos */}
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Veículos ({facetCounts.veiculos?.length || 0})</label>
                        <div className="max-h-20 overflow-y-auto space-y-1 border rounded p-1">
                          {(facetCounts.veiculos || []).slice(0, 5).map(({ value, count }) => (
                            <label key={value} className="flex items-center justify-between text-xs cursor-pointer hover:bg-muted/50 px-1 py-0.5 rounded">
                              <div className="flex items-center space-x-1 flex-1 min-w-0">
                                <Checkbox
                                  checked={filters.veiculos?.includes(value) || false}
                                  onCheckedChange={() => toggleArrayFilter('veiculos', value)}
                                />
                                <span className="truncate">{value}</span>
                              </div>
                              <Badge variant="secondary" className="ml-1 text-xs">{count}</Badge>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Região */}
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Região ({facetCounts.regiao?.length || 0})</label>
                        <div className="max-h-20 overflow-y-auto space-y-1 border rounded p-1">
                          {(facetCounts.regiao || []).slice(0, 6).map(({ value, count }) => (
                            <label key={value} className="flex items-center justify-between text-xs cursor-pointer hover:bg-muted/50 px-1 py-0.5 rounded">
                              <div className="flex items-center space-x-1 flex-1 min-w-0">
                                <Checkbox
                                  checked={filters.regiao?.includes(value) || false}
                                  onCheckedChange={() => toggleArrayFilter('regiao', value)}
                                />
                                <span className="truncate">{value}</span>
                              </div>
                              <Badge variant="secondary" className="ml-1 text-xs">{count}</Badge>
                            </label>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Ordenação */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">Ordenação</h4>
                    <Select value={filters.sort || 'relevance'} onValueChange={(sort) => updateFilters({ sort: sort as Filters['sort'] })}>
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Relevância</SelectItem>
                        <SelectItem value="name">Nome (A-Z)</SelectItem>
                        <SelectItem value="category">Categoria</SelectItem>
                        <SelectItem value="family">Família Botânica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

        </div>

        {/* Chips de Filtros Ativos */}
        {activeChips.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-muted-foreground">Filtros ativos:</span>
              {activeChips.map((chip) => (
                <Badge
                  key={chip.stableKey}
                  variant="secondary"
                  className="gap-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => removeFilter(chip.key, chip.value)}
                >
                  {chip.label}
                  <X className="w-3 h-3" />
                </Badge>
              ))}
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                Limpar todos
              </Button>
            </div>
          </div>
        )}

        {/* Resultados ou Erro */}
        {error ? (
          <div role="alert" className="min-h-[50vh] flex flex-col items-center justify-center text-center px-6">
            <div className="mb-3 text-3xl font-semibold">Falha ao carregar os dados</div>
            <p className="text-muted-foreground max-w-prose">
              Não foi possível acessar o catálogo de óleos essenciais. Por favor, tente novamente.
            </p>
            <div className="mt-6 flex gap-3">
              <Button onClick={loadData}>Tentar novamente</Button>
              <Button variant="outline" onClick={() => window.location.reload()}>Recarregar página</Button>
            </div>
          </div>
        ) : loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum resultado encontrado
            </h3>
            <p className="text-muted-foreground mb-4">
              Tente ajustar os filtros ou termos de busca
            </p>
            <Button onClick={clearAllFilters}>
              Limpar todos os filtros
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">
                {filteredProducts.length} óleo{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
              </p>
            </div>

            {filteredProducts.map((product) => {
              const { Icon, color } = getVisuals(product);
              return (
                <Card key={product.id} className="hover:shadow-card transition-all duration-200">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className={`p-3 rounded-lg ${color}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-xl mb-2">{product.nome_pt}</CardTitle>
                              <p className="text-muted-foreground italic">{product.nome_latim || "-"}</p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Badge variant="secondary">{product.categoria || "-"}</Badge>
                                <Badge variant="outline">{formatFamiliaOlfativa(product)}</Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDetails(product)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Detalhes
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Efeitos Esperados */}
                      <div>
                        <h4 className="font-medium mb-2 text-sm">Efeitos esperados</h4>
                        <div className="flex flex-wrap gap-1">
                          {(product.efeitos_esperados || []).slice(0, 4).map((effect, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">{effect}</Badge>
                          ))}
                          {(product.efeitos_esperados?.length || 0) > 4 && (
                            <Badge variant="outline" className="text-xs">+{(product.efeitos_esperados?.length || 0) - 4}</Badge>
                          )}
                        </div>
                      </div>

                      {/* Aplicações */}
                      <div>
                        <h4 className="font-medium mb-2 text-sm">Aplicações sugeridas</h4>
                        <div className="flex flex-wrap gap-1">
                          {(product.aplicacoes_sugeridas || []).slice(0, 3).map((app, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">{app}</Badge>
                          ))}
                          {(product.aplicacoes_sugeridas?.length || 0) > 3 && (
                            <Badge variant="secondary" className="text-xs">+{(product.aplicacoes_sugeridas?.length || 0) - 3}</Badge>
                          )}
                        </div>
                      </div>

                      {/* Principais Constituintes */}
                      <div>
                        <h4 className="font-medium mb-2 text-sm">Principais constituintes</h4>
                        <div className="space-y-1 text-xs">
                          {(product.principais_constituintes || []).slice(0, 3).map((const_, idx) => (
                            <div key={idx} className="text-muted-foreground">
                              {const_.percentual != null ? `${const_.nome} (${const_.percentual}%)` : const_.nome}
                            </div>
                          ))}
                          {(product.principais_constituintes?.length || 0) > 3 && (
                            <div className="text-muted-foreground">+{(product.principais_constituintes?.length || 0) - 3} outros</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Indicadores de Segurança */}
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${safetyDot(product.uso_pele_sensivel)}`} />
                          <span>Pele sens.: {formatSafety(product.uso_pele_sensivel)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${safetyDot(!product.fototoxico)}`} />
                          <span>Fototoxic.: {product.fototoxico === false ? "Não" : product.fototoxico === true ? "Sim" : "?"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${safetyDot(!product.sensibilizante)}`} />
                          <span>Sensibil.: {product.sensibilizante === false ? "Baixo" : product.sensibilizante === true ? "Alto" : "?"}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
          </TabsContent>

          {/* Aba da Calculadora */}
          <TabsContent value="calculadora">
            <BlendCalculator />
          </TabsContent>
        </Tabs>
      </div>

      {/* Oil Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedOil && (
            <>
              <DialogHeader className="sticky top-0 bg-background z-10 pb-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${getVisuals(selectedOil).color}`}>
                    {(() => {
                      const { Icon } = getVisuals(selectedOil);
                      return <Icon className="w-6 h-6" />;
                    })()}
                  </div>
                  <div className="flex-1">
                    <DialogTitle className="text-2xl">{selectedOil.nome_pt}</DialogTitle>
                    <p className="text-muted-foreground italic text-lg">{selectedOil.nome_latim || "-"}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="secondary">{selectedOil.categoria || "-"}</Badge>
                      <Badge variant="outline">{formatFamiliaOlfativa(selectedOil)}</Badge>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6">
                {/* Informações Básicas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Leaf className="w-5 h-5" />
                      Informações Básicas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Taxonomia</h4>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div>Família botânica: {selectedOil.familia_botanica || "-"}</div>
                        <div>Família olfativa: {formatFamiliaOlfativa(selectedOil)}</div>
                        <div>Parte usada: {selectedOil.parte_usada || "-"}</div>
                        <div>Método de extração: {formatMetodoExtracao(selectedOil)}</div>
                        <div>Região de origem: {selectedOil.regiao_origem || "-"}</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Segurança</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${safetyDot(selectedOil.uso_pele_sensivel)}`} />
                          <span>Pele sensível: {formatSafety(selectedOil.uso_pele_sensivel)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${safetyDot(selectedOil.uso_ambiente_clinico)}`} />
                          <span>Ambiente clínico: {formatSafety(selectedOil.uso_ambiente_clinico)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${safetyDot(!selectedOil.fototoxico)}`} />
                          <span>Fototóxico: {selectedOil.fototoxico === false ? "Não" : selectedOil.fototoxico === true ? "Sim" : "Não informado"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${safetyDot(!selectedOil.sensibilizante)}`} />
                          <span>Sensibilizante: {selectedOil.sensibilizante === false ? "Baixo risco" : selectedOil.sensibilizante === true ? "Alto risco" : "Não informado"}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Constituintes Químicos */}
                {selectedOil.principais_constituintes && selectedOil.principais_constituintes.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Beaker className="w-5 h-5" />
                        Principais Constituintes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {formatConstituintes(selectedOil.principais_constituintes).map((const_, idx) => (
                          <Badge key={idx} variant="outline" className="justify-center">
                            {const_}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Efeitos e Aplicações */}
                <div className="grid md:grid-cols-2 gap-6">
                  {selectedOil.efeitos_esperados && selectedOil.efeitos_esperados.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Heart className="w-5 h-5" />
                          Efeitos Esperados
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {selectedOil.efeitos_esperados.map((effect, idx) => (
                            <Badge key={idx} variant="secondary">
                              {effect}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {selectedOil.aplicacoes_sugeridas && selectedOil.aplicacoes_sugeridas.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Brain className="w-5 h-5" />
                          Aplicações Sugeridas
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {selectedOil.aplicacoes_sugeridas.map((app, idx) => (
                            <Badge key={idx} variant="outline">
                              {app}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Veículos e Diluições */}
                {(selectedOil.veiculos_recomendados?.length || selectedOil.diluicoes) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Beaker className="w-5 h-5" />
                        Uso e Diluições
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-4">
                      {selectedOil.veiculos_recomendados && selectedOil.veiculos_recomendados.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Veículos recomendados</h4>
                          <div className="flex flex-wrap gap-1">
                            {selectedOil.veiculos_recomendados.map((vehicle, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {vehicle}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedOil.diluicoes && (
                        <div>
                          <h4 className="font-medium mb-2">Diluições</h4>
                          <div className="text-sm text-muted-foreground">
                            {selectedOil.diluicoes.geral && <div>Geral: {selectedOil.diluicoes.geral}</div>}
                            {selectedOil.diluicoes.valores_percent && selectedOil.diluicoes.valores_percent.length > 0 && (
                              <div>
                                Percentuais: {selectedOil.diluicoes.valores_percent.map(p => `${p}%`).join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Restrições por Público */}
                {selectedOil.publicos_restritos && Object.values(selectedOil.publicos_restritos).some(v => v !== null && v !== undefined) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Restrições por Público
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        {selectedOil.publicos_restritos.gravidez !== null && (
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${selectedOil.publicos_restritos.gravidez ? "bg-red-500" : "bg-green-500"}`} />
                            <span>Gravidez: {selectedOil.publicos_restritos.gravidez ? "Evitar" : "Permitido"}</span>
                          </div>
                        )}
                        {selectedOil.publicos_restritos.lactacao !== null && (
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${selectedOil.publicos_restritos.lactacao ? "bg-red-500" : "bg-green-500"}`} />
                            <span>Lactação: {selectedOil.publicos_restritos.lactacao ? "Evitar" : "Permitido"}</span>
                          </div>
                        )}
                        {selectedOil.publicos_restritos.criancas_min_idade !== null && (
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-yellow-500" />
                            <span>Idade mínima: {selectedOil.publicos_restritos.criancas_min_idade} anos</span>
                          </div>
                        )}
                        {selectedOil.publicos_restritos.epilepsia !== null && (
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${selectedOil.publicos_restritos.epilepsia ? "bg-red-500" : "bg-green-500"}`} />
                            <span>Epilepsia: {selectedOil.publicos_restritos.epilepsia ? "Evitar" : "Permitido"}</span>
                          </div>
                        )}
                        {selectedOil.publicos_restritos.asma !== null && (
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${selectedOil.publicos_restritos.asma ? "bg-red-500" : "bg-green-500"}`} />
                            <span>Asma: {selectedOil.publicos_restritos.asma ? "Evitar" : "Permitido"}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Precauções e Contraindicações */}
                {(selectedOil.precaucoes || selectedOil.contraindicacoes || selectedOil.notas_rapidas_seguranca) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Segurança e Precauções
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedOil.precaucoes && (
                        <div>
                          <h4 className="font-medium mb-2">Precauções</h4>
                          <div className="text-sm text-muted-foreground space-y-1">
                            {splitBullets(selectedOil.precaucoes).map((precaution, idx) => (
                              <div key={idx}>• {precaution}</div>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedOil.contraindicacoes && (
                        <div>
                          <h4 className="font-medium mb-2">Contraindicações</h4>
                          <div className="text-sm text-muted-foreground space-y-1">
                            {splitBullets(selectedOil.contraindicacoes).map((contraindication, idx) => (
                              <div key={idx}>• {contraindication}</div>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedOil.notas_rapidas_seguranca && (
                        <div>
                          <h4 className="font-medium mb-2">Notas de Segurança</h4>
                          <div className="text-sm text-muted-foreground space-y-1">
                            {splitBullets(selectedOil.notas_rapidas_seguranca).map((note, idx) => (
                              <div key={idx}>• {note}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Informações Adicionais */}
                {(selectedOil.propriedades_tradicionais || selectedOil.etnobotanica_geral) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        Informações Tradicionais
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedOil.propriedades_tradicionais && (
                        <div>
                          <h4 className="font-medium mb-2">Propriedades tradicionais</h4>
                          <p className="text-sm text-muted-foreground">
                            {selectedOil.propriedades_tradicionais}
                          </p>
                        </div>
                      )}
                      {selectedOil.etnobotanica_geral && (
                        <div>
                          <h4 className="font-medium mb-2">Etnobotânica</h4>
                          <p className="text-sm text-muted-foreground">
                            {selectedOil.etnobotanica_geral}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Sinergias e Incompatibilidades */}
                {((selectedOil.sinergias_sugeridas && selectedOil.sinergias_sugeridas.length > 0) ||
                  (selectedOil.incompatibilidades_praticas && selectedOil.incompatibilidades_praticas.length > 0)) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Heart className="w-5 h-5" />
                        Sinergias e Incompatibilidades
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedOil.sinergias_sugeridas && selectedOil.sinergias_sugeridas.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Sinergias sugeridas</h4>
                          <div className="flex flex-wrap gap-1">
                            {selectedOil.sinergias_sugeridas.map((sinergia, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {sinergia}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedOil.incompatibilidades_praticas && selectedOil.incompatibilidades_praticas.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Incompatibilidades práticas</h4>
                          <div className="flex flex-wrap gap-1">
                            {selectedOil.incompatibilidades_praticas.map((incomp, idx) => (
                              <Badge key={idx} variant="destructive" className="text-xs">
                                {incomp}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Fontes */}
                {selectedOil.fontes && selectedOil.fontes.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        Fontes e Referências
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedOil.fontes.map((fonte, idx) => (
                          <div key={idx} className="text-sm">
                            {fonte.url ? (
                              <a 
                                href={fonte.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                {fonte.ref || fonte.url}
                              </a>
                            ) : (
                              <span className="text-muted-foreground">{fonte.ref}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Footer com informações sobre dados */}
      <footer className="mt-12 text-center text-xs text-muted-foreground">
        <p>Dados salvos localmente no seu dispositivo</p>
      </footer>
    </div>
  );
};

export default Oleos;
