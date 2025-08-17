import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { loadRecipes } from "@/services/dataStore";
import { onChange } from "@/lib/bus";
import { 
  Search, 
  Filter, 
  Clock, 
  Users, 
  AlertTriangle,
  Droplets,
  Heart,
  Brain,
  Shield,
  X,
  Loader2
} from "lucide-react";

const INTENT_TERMS: Record<string, string[]> = {
  "Sono": ["sono","insôni","insomi","noturn"],
  "Ansiedade/Relaxamento": ["ansiedad","relax","estresse","calm"],
  "Respiratório": ["respirat","congest","rinite","sinus","tosse","bronq"],
  "Muscular": ["muscul","tens","analges","dor"],
  "Pele/Face": ["pele","face","sérum","serum","acne","oleos"],
  "Purificação/Ambiente": ["purific","ambiente","spray","ar","odor","higien"],
  "Foco": ["foco","concentr","clareza","vigíl","alerta"]
};

type Ingredient =
  | { type: "essential_oil"; name_pt: string; latin?: string; drops?: number }
  | { type: "carrier_oil" | "solvent" | "solubilizer" | "water"; name_pt: string; amount_ml?: number }
  | { type?: string; name_pt?: string; latin?: string; drops?: number; amount_ml?: number };

type Recipe = {
  id: string | number;
  name: string;
  purpose?: string | string[];
  application?: string;
  difficulty?: string;
  prep_time?: string;
  yield?: string;
  ingredients?: Array<Ingredient | string>;
  steps?: string[];
  dilution?: { context?: string; percent?: number; note?: string };
  validity?: string;
  contraindications?: string | string[];
  safety_notes?: string | string[];
  tags?: string[];
  references?: { title?: string; url?: string }[];
};

type Filters = {
  q?: string;
  sort?: "relevance" | "name" | "application" | "difficulty" | "prep_time";
  
  // existing
  application?: string[];
  difficulty?: string[];
  tags?: string[];
  
  // new
  intents?: string[];
  ingredients?: string[];
  safety?: Array<"evitar_epilepsia"|"cautela_asma"|"no_gravidez"|"no_pediatrico"|"evitar_fototoxico_leaveon">;
  prepRange?: Array<"lte5"|"btw6_10"|"gt10">;
  dilution?: Array<"no_pct"|"lte1"|"eq2"|"gt2">;
  meta?: Array<"has_contra"|"has_refs">;
};

const Receitas = () => {
  console.log("🚀 Componente Receitas renderizado");
  
  // Helper para normalizar dados de receitas
  const toRecipeArray = (data: any): Recipe[] => 
    Array.isArray(data?.recipes) ? data.recipes :
    (Array.isArray(data) ? data : []);
  
  // Estado dos dados
  const [items, setItems] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estado da busca
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  
  // Estado dos filtros
  const [filters, setFilters] = useState<Filters>({});
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  // Carregamento dos dados via dataStore
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadRecipes();
      setItems(toRecipeArray(data));
    } catch (e: any) {
      console.error("Erro ao carregar receitas:", e);
      setItems([]);
      setError("Não foi possível carregar as receitas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    console.log("🎯 USEEFFECT EXECUTADO"); 
    loadData(); 
  }, [loadData]);

  // Listen for data changes
  useEffect(() => {
    const off = onChange((c) => {
      if (c.type === "recipes") loadData();
    });
    return off;
  }, [loadData]);

  // Sincronização com URL
  useEffect(() => {
    const params = {
      application: searchParams.getAll("application"),
      difficulty: searchParams.getAll("difficulty"),
      tags: searchParams.getAll("tags"),
      intents: searchParams.getAll("intents"),
      ingredients: searchParams.getAll("ingredients"),
      safety: searchParams.getAll("safety") as Filters["safety"],
      prepRange: searchParams.getAll("prepRange") as Filters["prepRange"],
      dilution: searchParams.getAll("dilution") as Filters["dilution"],
      meta: searchParams.getAll("meta") as Filters["meta"],
      q: searchParams.get("q") || "",
      sort: (searchParams.get("sort") as Filters["sort"]) || "relevance"
    };
    setFilters(params);
    setSearchInput(params.q || "");
    setSearchTerm(params.q || "");
  }, [searchParams]);

  const updateFilters = useCallback((patch: Partial<Filters>) => {
    setFilters(prev => {
      const f = { ...prev, ...patch };
      const p = new URLSearchParams();
      const setParam = (k: keyof Filters, v?: string | string[]) => {
        if (!v) return;
        if (Array.isArray(v)) v.forEach(x => x && p.append(k as string, x));
        else if (typeof v === "string" && v) p.set(k as string, v);
      };
      setParam("q", f.q);
      setParam("application", f.application);
      setParam("difficulty", f.difficulty);
      setParam("tags", f.tags);
      setParam("intents", f.intents);
      setParam("ingredients", f.ingredients);
      setParam("safety", f.safety);
      setParam("prepRange", f.prepRange);
      setParam("dilution", f.dilution);
      setParam("meta", f.meta);
      setParam("sort", f.sort);
      setSearchParams(p, { replace: true });
      return f;
    });
  }, [setSearchParams]);

  // Busca com debounce
  useEffect(() => {
    if (searchInput !== searchTerm) setIsSearching(true);
    const t = setTimeout(() => {
      if (searchInput !== searchTerm) {
        setSearchTerm(searchInput);
        updateFilters({ q: searchInput });
        setIsSearching(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput, searchTerm, updateFilters]);

  // Helpers
  const toArray = (v: any) => Array.isArray(v) ? v : (v ? [v] : []);
  const formatIngredient = (ing: Ingredient | string) => {
    if (typeof ing === "string") return ing;
    const obj = ing as any;
    return [
      obj.name_pt, 
      obj.latin ? `(${obj.latin})` : "", 
      obj.drops != null ? `- ${obj.drops} gotas` : "", 
      obj.amount_ml != null ? `- ${obj.amount_ml} ml` : ""
    ].filter(Boolean).join(" ");
  };

  const norm = (s?: string) => (s || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

  const mentions = (r: Recipe) => {
    const txt = [ ...toArray(r.safety_notes), ...toArray(r.contraindications) ]
      .map(norm).join(" ");
    return txt;
  };

  function safetyMatch(r: Recipe, flag: NonNullable<Filters["safety"]>[number]) {
    const m = mentions(r);
    if (flag === "evitar_epilepsia") return /epileps/.test(m);
    if (flag === "cautela_asma") return /asma/.test(m);
    if (flag === "no_gravidez") return !/gravid/.test(m);
    if (flag === "no_pediatrico") return !/(crian|beb|pediatr)/.test(m);
    if (flag === "evitar_fototoxico_leaveon") {
      const leaveOn = /(roll|sérum|serum|leave-?on|tópico|topico)/.test(norm(r.application));
      const foto = /(foto|fototóx|fotossens)/.test(m);
      return leaveOn && foto;
    }
    return true;
  }

  function parseMinutes(prep?: string): number | null {
    if (!prep) return null;
    const m = prep.match(/(\d+)\s*min/gi);
    if (!m) return null;
    const n = m.map(x => parseInt(x,10)).filter(n=>!isNaN(n));
    return n.length ? Math.max(...n) : null;
  }

  function dilutionBand(pct?: number | null | undefined): "no_pct"|"lte1"|"eq2"|"gt2" | null {
    if (pct == null) return "no_pct";
    if (pct <= 1) return "lte1";
    if (Math.abs(pct - 2) < 0.01) return "eq2";
    if (pct > 2) return "gt2";
    return null;
  }

  // Opções dinâmicas dos filtros
  const applicationOptions = useMemo(() => {
    const list = Array.isArray(items) ? items : [];
    return Array.from(new Set(list.map(r => r.application).filter(Boolean))) as string[];
  }, [items]);
  
  const difficultyOptions = useMemo(() => {
    const list = Array.isArray(items) ? items : [];
    return Array.from(new Set(list.map(r => r.difficulty).filter(Boolean))) as string[];
  }, [items]);
  
  const tagOptions = useMemo(() => {
    const list = Array.isArray(items) ? items : [];
    return Array.from(new Set(list.flatMap(r => toArray(r.tags)).filter(Boolean))) as string[];
  }, [items]);

  // Ingredientes: PT + latim, únicos
  const ingredientOptions = useMemo(() => {
    const set = new Set<string>();
    const list = Array.isArray(items) ? items : [];
    list.forEach(r => {
      (Array.isArray(r.ingredients) ? r.ingredients : []).forEach((ing) => {
        if (typeof ing === "string") { set.add(ing); }
        else {
          if (ing.name_pt) set.add(ing.name_pt);
          if ((ing as any).latin) set.add((ing as any).latin);
        }
      });
    });
    return Array.from(set).sort((a,b)=>a.localeCompare(b));
  }, [items]);

  // Filtros aplicados
  const results = useMemo(() => {
    const list = Array.isArray(items) ? items : [];
    console.log("🔍 FILTROS - ITEMS:", list.length);
    const q = norm(searchTerm);
    const rows = list.filter(r => {
      let ok = true;
      let bag = "";

      // Busca livre
      if (q) {
        bag = [
          r.name, r.application, r.difficulty,
          ...toArray(r.purpose), ...toArray(r.tags),
          ...toArray(r.ingredients).map(i => typeof i === "string" ? i : [i.name_pt, (i as any).latin].filter(Boolean).join(" ")),
          ...toArray(r.steps), ...toArray(r.safety_notes), ...toArray(r.contraindications)
        ].map(norm).join(" ");
        ok = bag.includes(q);
      }

      // INTENÇÕES (purpose/tags)
      if (ok && (filters.intents?.length)) {
        const bagIntent = [...toArray(r.purpose), ...toArray(r.tags)].map(norm).join(" ");
        ok = filters.intents.some(intent => (INTENT_TERMS[intent]||[]).some(t => bagIntent.includes(t)));
      }

      // Aplicação
      if (ok && (filters.application?.length)) ok = filters.application.includes(r.application || "");
      // Dificuldade
      if (ok && (filters.difficulty?.length)) ok = filters.difficulty.includes(r.difficulty || "");

      // INGREDIENTES
      if (ok && (filters.ingredients?.length)) {
        const ingBag = toArray(r.ingredients);
        ok = ingBag.some(ing => {
          if (typeof ing === "string") return filters.ingredients!.some(val => norm(ing) === norm(val));
          const vals = [ing.name_pt, (ing as any).latin].filter(Boolean).map(String);
          return vals.some(v => filters.ingredients!.some(val => norm(v) === norm(val)));
        });
      }

      // Tags
      if (ok && (filters.tags?.length)) ok = toArray(r.tags).some(t => filters.tags!.includes(t));

      // SEGURANÇA
      if (ok && (filters.safety?.length)) {
        const mustMention = filters.safety.filter(s => s==="evitar_epilepsia" || s==="cautela_asma");
        const mustNotMention = filters.safety.filter(s => s==="no_gravidez" || s==="no_pediatrico");
        const avoidFoto = filters.safety.includes("evitar_fototoxico_leaveon");

        if (mustMention.length) {
          ok = mustMention.every(flag => safetyMatch(r, flag));
        }
        if (ok && mustNotMention.length) {
          ok = mustNotMention.every(flag => safetyMatch(r, flag));
        }
        if (ok && avoidFoto) {
          ok = !safetyMatch(r, "evitar_fototoxico_leaveon");
        }
      }

      // TEMPO DE PREPARO
      if (ok && (filters.prepRange?.length)) {
        const min = parseMinutes(r.prep_time || "");
        const band = (min==null) ? null
          : (min <= 5 ? "lte5" : (min <= 10 ? "btw6_10" : "gt10"));
        ok = band != null && filters.prepRange.includes(band);
      }

      // DILUIÇÃO
      if (ok && (filters.dilution?.length)) {
        const band = dilutionBand(r.dilution?.percent);
        ok = band != null && filters.dilution.includes(band);
      }

      // META
      if (ok && (filters.meta?.length)) {
        const hasContra = toArray(r.contraindications).length > 0;
        const hasRefs = toArray(r.references).length > 0;
        ok = filters.meta.every(m => 
          (m==="has_contra" ? hasContra : true) &&
          (m==="has_refs" ? hasRefs : true)
        );
      }

      return ok;
    });

    // Ordenação
    return [...rows].sort((a, b) => {
      const by = filters.sort || "relevance";
      if (by === "name") return (a.name || "").localeCompare(b.name || "");
      if (by === "application") return (a.application || "").localeCompare(b.application || "");
      if (by === "difficulty") return (a.difficulty || "").localeCompare(b.difficulty || "");
      if (by === "prep_time") {
        const pa = parseMinutes(a.prep_time || "") ?? 1e9;
        const pb = parseMinutes(b.prep_time || "") ?? 1e9;
        if (pa !== pb) return pa - pb;
      }
      // Relevance: prioriza busca no nome
      if (searchTerm) {
        const inA = norm(a.name).includes(q) ? 1 : 0;
        const inB = norm(b.name).includes(q) ? 1 : 0;
        if (inB !== inA) return inB - inA;
      }
      return (a.name || "").localeCompare(b.name || "");
    });
    console.log("✅ RESULTS:", rows.length);
    return rows;
  }, [items, searchTerm, filters]);

  function getVisuals(r: Recipe) {
    const a = (r.application || "").toLowerCase();
    if (a.includes("difusor") || a.includes("inala")) return { Icon: Brain, color: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" };
    if (a.includes("massagem") || a.includes("roll")) return { Icon: Heart, color: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400" };
    if (a.includes("spray") || a.includes("ambiente")) return { Icon: Shield, color: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400" };
    if (a.includes("compressa") || a.includes("banho") || a.includes("escalda")) return { Icon: Droplets, color: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400" };
    return { Icon: Filter, color: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300" };
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Iniciante": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "Intermediário": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "Avançado": return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const canExport = !error && !loading && results.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Lista de Receitas Disponíveis
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Receitas de aromaterapia para organização de dados. 
            As receitas são de responsabilidade exclusiva de quem as cadastra e utiliza.
          </p>
          
        </div>

        {/* Filtros */}
        <Card className="mb-8">
          <CardContent className="p-6">
            {/* Intenções rápidas */}
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">Intenções</h3>
              <div className="flex flex-wrap gap-2">
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
                    className="text-xs"
                  >
                    {intent}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-5 gap-4">
              {/* Busca */}
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  inputMode="search"
                  enterKeyHint="search"
                  aria-label="Buscar receitas por nome, propósito, aplicação, ingrediente ou tag"
                  placeholder="Buscar receitas…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchInput !== searchTerm) {
                      setSearchTerm(searchInput);
                      updateFilters({ q: searchInput });
                      setIsSearching(false);
                    }
                  }}
                  className="pl-10 pr-10"
                />
                {isSearching && (
                  <Loader2 className="absolute right-8 top-3 h-4 w-4 text-muted-foreground animate-spin" />
                )}
                {searchInput && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1 h-8 w-8"
                    onClick={() => {
                      setSearchInput("");
                      setSearchTerm("");
                      updateFilters({ q: "" });
                      setIsSearching(false);
                    }}
                    aria-label="Limpar busca"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {/* Aplicação Multi */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="justify-between">
                    {filters.application?.length ? `${filters.application.length} selecionadas` : "Aplicação"}
                    <Filter className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  {applicationOptions.map(app => (
                    <DropdownMenuItem
                      key={app}
                      onClick={(e) => {
                        e.preventDefault();
                        const current = filters.application || [];
                        const updated = current.includes(app) 
                          ? current.filter(a => a !== app)
                          : [...current, app];
                        updateFilters({ application: updated });
                      }}
                      className="flex items-center space-x-2"
                    >
                      <input
                        type="checkbox"
                        checked={filters.application?.includes(app) || false}
                        onChange={() => {}}
                        className="w-4 h-4"
                      />
                      <span>{app}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Dificuldade Multi */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="justify-between">
                    {filters.difficulty?.length ? `${filters.difficulty.length} selecionadas` : "Dificuldade"}
                    <Filter className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  {difficultyOptions.map(diff => (
                    <DropdownMenuItem
                      key={diff}
                      onClick={(e) => {
                        e.preventDefault();
                        const current = filters.difficulty || [];
                        const updated = current.includes(diff) 
                          ? current.filter(d => d !== diff)
                          : [...current, diff];
                        updateFilters({ difficulty: updated });
                      }}
                      className="flex items-center space-x-2"
                    >
                      <input
                        type="checkbox"
                        checked={filters.difficulty?.includes(diff) || false}
                        onChange={() => {}}
                        className="w-4 h-4"
                      />
                      <span>{diff}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Ordenação */}
              <Select 
                value={filters.sort || "relevance"} 
                onValueChange={(v) => updateFilters({ sort: v as Filters["sort"] })}
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

            {/* Filtros adicionais em linha separada */}
            <div className="grid md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
              {/* Segurança */}
              <div>
                <h4 className="text-sm font-medium mb-2">Segurança</h4>
                <div className="space-y-1 text-xs">
                  {[
                    { key: "evitar_epilepsia", label: "Evitar em epilepsia" },
                    { key: "cautela_asma", label: "Cautela em asma" },
                    { key: "no_gravidez", label: "Sem menção de gravidez" },
                    { key: "no_pediatrico", label: "Sem menção pediátrica" },
                    { key: "evitar_fototoxico_leaveon", label: "Evitar fotossensibilizantes" }
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={filters.safety?.includes(key as any) || false}
                        onChange={(e) => {
                          const current = filters.safety || [];
                          const updated = e.target.checked 
                            ? [...current, key as any]
                            : current.filter(s => s !== key);
                          updateFilters({ safety: updated });
                        }}
                        className="w-3 h-3"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Tempo de preparo */}
              <div>
                <h4 className="text-sm font-medium mb-2">Tempo de preparo</h4>
                <div className="space-y-1 text-xs">
                  {[
                    { key: "lte5", label: "≤5 min" },
                    { key: "btw6_10", label: "6-10 min" },
                    { key: "gt10", label: ">10 min" }
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={filters.prepRange?.includes(key as any) || false}
                        onChange={(e) => {
                          const current = filters.prepRange || [];
                          const updated = e.target.checked 
                            ? [...current, key as any]
                            : current.filter(p => p !== key);
                          updateFilters({ prepRange: updated });
                        }}
                        className="w-3 h-3"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Diluição */}
              <div>
                <h4 className="text-sm font-medium mb-2">Diluição</h4>
                <div className="space-y-1 text-xs">
                  {[
                    { key: "no_pct", label: "Sem %" },
                    { key: "lte1", label: "≤1%" },
                    { key: "eq2", label: "~2%" },
                    { key: "gt2", label: ">2%" }
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={filters.dilution?.includes(key as any) || false}
                        onChange={(e) => {
                          const current = filters.dilution || [];
                          const updated = e.target.checked 
                            ? [...current, key as any]
                            : current.filter(d => d !== key);
                          updateFilters({ dilution: updated });
                        }}
                        className="w-3 h-3"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Metadados */}
              <div>
                <h4 className="text-sm font-medium mb-2">Metadados</h4>
                <div className="space-y-1 text-xs">
                  {[
                    { key: "has_contra", label: "Tem contraindicações" },
                    { key: "has_refs", label: "Tem referências" }
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={filters.meta?.includes(key as any) || false}
                        onChange={(e) => {
                          const current = filters.meta || [];
                          const updated = e.target.checked 
                            ? [...current, key as any]
                            : current.filter(m => m !== key);
                          updateFilters({ meta: updated });
                        }}
                        className="w-3 h-3"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Filters Chips */}
        {(filters.intents?.length || filters.application?.length || filters.difficulty?.length || 
          filters.ingredients?.length || filters.tags?.length || filters.safety?.length ||
          filters.prepRange?.length || filters.dilution?.length || filters.meta?.length || 
          filters.q) && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Filtros ativos:</span>
                
                {filters.q && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {filters.q}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => {
                      setSearchInput(""); setSearchTerm(""); updateFilters({ q: "" });
                    }} />
                  </Badge>
                )}

                {filters.intents?.map(intent => (
                  <Badge key={intent} variant="secondary" className="flex items-center gap-1">
                    {intent}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => {
                      updateFilters({ intents: filters.intents?.filter(i => i !== intent) });
                    }} />
                  </Badge>
                ))}

                {filters.application?.map(app => (
                  <Badge key={app} variant="secondary" className="flex items-center gap-1">
                    {app}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => {
                      updateFilters({ application: filters.application?.filter(a => a !== app) });
                    }} />
                  </Badge>
                ))}

                {filters.difficulty?.map(diff => (
                  <Badge key={diff} variant="secondary" className="flex items-center gap-1">
                    {diff}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => {
                      updateFilters({ difficulty: filters.difficulty?.filter(d => d !== diff) });
                    }} />
                  </Badge>
                ))}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchInput("");
                    setSearchTerm("");
                    updateFilters({
                      q: "",
                      application: [],
                      difficulty: [],
                      tags: [],
                      intents: [],
                      ingredients: [],
                      safety: [],
                      prepRange: [],
                      dilution: [],
                      meta: []
                    });
                  }}
                  className="text-xs"
                >
                  Limpar tudo
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contador */}
        <p aria-live="polite" className="text-sm text-muted-foreground mb-4 font-medium">
          Resultados ({results.length})
        </p>

        {/* Conteúdo principal */}
        {error ? (
          <div role="alert" className="min-h-[50vh] flex flex-col items-center justify-center text-center px-6">
            <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="mb-2 text-2xl font-semibold">Falha ao carregar as receitas</h2>
            <p className="text-muted-foreground mb-2">
              Adicione <code className="bg-muted px-2 py-1 rounded text-sm">recipes_catalog.json</code> em{" "}
              <code className="bg-muted px-2 py-1 rounded text-sm">/public/data/</code> e tente novamente.
            </p>
            <div className="mt-6 flex gap-3">
              <Button onClick={loadData}>Tentar novamente</Button>
              <Button variant="outline" onClick={() => window.location.reload()}>Recarregar</Button>
            </div>
          </div>
        ) : loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhuma receita encontrada
            </h3>
            <p className="text-muted-foreground">
              Tente ajustar os filtros ou termos de busca
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {results.map((recipe) => {
              const { Icon, color } = getVisuals(recipe);
              return (
                <Card key={`${recipe.id}:${recipe.name}`} className="hover:shadow-card transition-all duration-200">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className={`p-3 rounded-lg ${color}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <CardTitle className="text-xl mb-2">{recipe.name}</CardTitle>
                          <p className="text-muted-foreground">
                            {Array.isArray(recipe.purpose) ? recipe.purpose.join(", ") : recipe.purpose}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {recipe.difficulty && (
                          <Badge className={getDifficultyColor(recipe.difficulty)}>
                            {recipe.difficulty}
                          </Badge>
                        )}
                        {recipe.application && (
                          <Badge variant="secondary">{recipe.application}</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Ingredientes */}
                    {recipe.ingredients && recipe.ingredients.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-foreground mb-3">Ingredientes:</h4>
                        <ul className="space-y-1">
                          {toArray(recipe.ingredients).map((ingredient, index) => (
                            <li key={index} className="text-sm text-muted-foreground">
                              • {formatIngredient(ingredient)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Passos */}
                    {recipe.steps && recipe.steps.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-foreground mb-3">Modo de preparo:</h4>
                        <ol className="space-y-1 list-decimal list-inside">
                          {toArray(recipe.steps).map((step, index) => (
                            <li key={index} className="text-sm text-muted-foreground">
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {/* Informações da receita */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        {recipe.prep_time && (
                          <div className="flex items-center space-x-2 text-sm">
                            <Clock className="w-4 h-4 text-primary" />
                            <span className="font-medium">Tempo de preparo:</span>
                            <span className="text-muted-foreground">{recipe.prep_time}</span>
                          </div>
                        )}
                        
                        {recipe.validity && (
                          <div className="flex items-center space-x-2 text-sm">
                            <Shield className="w-4 h-4 text-success" />
                            <span className="font-medium">Validade:</span>
                            <span className="text-muted-foreground">{recipe.validity}</span>
                          </div>
                        )}

                        {recipe.yield && (
                          <div className="flex items-center space-x-2 text-sm">
                            <Users className="w-4 h-4 text-primary" />
                            <span className="font-medium">Rendimento:</span>
                            <span className="text-muted-foreground">{recipe.yield}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        {recipe.contraindications && toArray(recipe.contraindications).length > 0 && (
                          <div>
                            <div className="flex items-center space-x-2 text-sm mb-2">
                              <AlertTriangle className="w-4 h-4 text-destructive" />
                              <span className="font-medium">Contraindicações:</span>
                            </div>
                            <ul className="text-sm text-muted-foreground pl-6">
                              {toArray(recipe.contraindications).map((contra, index) => (
                                <li key={index}>• {contra}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {recipe.tags && recipe.tags.length > 0 && (
                          <div>
                            <span className="font-medium text-sm">Tags:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {recipe.tags.map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Notas de segurança */}
                    {recipe.safety_notes && toArray(recipe.safety_notes).length > 0 && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <div className="flex items-start space-x-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-yellow-800 dark:text-yellow-200 text-sm mb-1">
                              Observações de Segurança:
                            </p>
                            <div className="text-sm text-yellow-700 dark:text-yellow-300">
                              {toArray(recipe.safety_notes).map((note, index) => (
                                <p key={index} className={index > 0 ? "mt-1" : ""}>
                                  {note}
                                </p>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Diluição */}
                    {recipe.dilution && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-start space-x-2">
                          <Droplets className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-blue-800 dark:text-blue-200 text-sm mb-1">
                              {recipe.dilution.context || "Diluição"}:
                            </p>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              {recipe.dilution.percent != null ? `${recipe.dilution.percent}%` : ""}
                              {recipe.dilution.note ? ` - ${recipe.dilution.note}` : ""}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Footer com informações sobre dados */}
      <footer className="mt-12 text-center text-xs text-muted-foreground">
        <p>Dados salvos localmente no seu dispositivo</p>
      </footer>
    </div>
  );
};

export default Receitas;
