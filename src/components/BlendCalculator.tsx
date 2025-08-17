import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Plus, X, Beaker, CheckCircle, AlertCircle, Calculator, Droplet, Pipette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Note = "alta" | "media" | "baixa";

type BlendOil = {
  id: string;
  nome_pt: string;
  nota: Note;
  percentage: number;
};

type NoteRule = {
  note: Note;
  label: string;
  maxPercentage: number;
  color: string;
};

type BlendCalculatorOil = {
  id: string;
  note: Note;
};

type ProportionTarget = {
  value: string;
  label: string;
  dilution: number;
};

const NOTE_RULES: NoteRule[] = [
  { note: "alta", label: "Nota Alta", maxPercentage: 15, color: "bg-yellow-500" },
  { note: "media", label: "Nota Média", maxPercentage: 80, color: "bg-green-500" },
  { note: "baixa", label: "Nota Baixa", maxPercentage: 5, color: "bg-blue-500" }
];

// Mapeamento de óleos essenciais comuns com suas notas
const OIL_NOTES: Record<string, Note> = {
  "lavanda": "media",
  "hortelã-pimenta": "alta", 
  "tea tree": "media",
  "eucalipto": "alta",
  "alecrim": "media",
  "bergamota": "alta",
  "laranja doce": "alta",
  "limão": "alta",
  "ylang ylang": "baixa",
  "patchouli": "baixa",
  "sândalo": "baixa",
  "cedro": "baixa",
  "vetiver": "baixa",
  "gerânio": "media",
  "camomila": "media",
  "palmarosa": "media",
  "lemongrass": "alta",
  "citronela": "alta",
  "manjericão": "media"
};

const DILUTION_TABLE = [
  { public: "Crianças de 5 a 14 anos", dilution: "Até 1,25%" },
  { public: "Crianças acima de 14 anos", dilution: "Até 5%" },
  { public: "Adultos", dilution: "Até 5%" },
  { public: "Idosos", dilution: "Até 1,25%" }
];

const TARGET_AUDIENCES = [
  { value: "children_5_14", label: "Crianças de 5 a 14 anos", dilution: 1.25 },
  { value: "children_over_14", label: "Crianças acima de 14 anos", dilution: 5 },
  { value: "adults", label: "Adultos", dilution: 5 },
  { value: "elderly", label: "Idosos", dilution: 1.25 }
];

const PROPORTION_TARGET_AUDIENCES: ProportionTarget[] = [
  { value: "children_0_4", label: "Crianças (0 a 4 anos)", dilution: 0.15625 },
  { value: "children_5_14", label: "Crianças (5 a 14 anos)", dilution: 1.25 },
  { value: "teens_adults", label: "Adolescentes e adultos (14+)", dilution: 5 },
  { value: "elderly", label: "Idosos", dilution: 1.25 }
];

export const BlendCalculator = () => {
  const { toast } = useToast();

  // Estados da calculadora unificada
  const [carrierOilQuantity, setCarrierOilQuantity] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [manualDilution, setManualDilution] = useState("");
  const [oilsList, setOilsList] = useState<Array<{id: string, name: string, note: Note}>>([]);

  // Validação de diluição manual
  const validateDilution = (value: string, audienceValue: string): { isValid: boolean; message?: string } => {
    const audience = TARGET_AUDIENCES.find(a => a.value === audienceValue);
    if (!audience) return { isValid: false, message: "Selecione um público-alvo primeiro" };

    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) return { isValid: false, message: "Digite um valor válido" };

    if (numValue > audience.dilution) {
      return { 
        isValid: false, 
        message: `A diluição máxima para este público é de ${audience.dilution}%. Por favor, ajuste o valor.` 
      };
    }

    return { isValid: true };
  };

  // Auto-detectar nota do óleo se disponível
  const detectOilNote = (name: string): Note => {
    const normalizedName = name.toLowerCase();
    const foundNote = Object.entries(OIL_NOTES).find(([oilName]) => 
      normalizedName.includes(oilName)
    );
    return foundNote ? foundNote[1] : "media";
  };

  // Funções da calculadora unificada
  const addOil = () => {
    if (oilsList.length >= 5) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Máximo de 5 óleos permitidos"
      });
      return;
    }
    
    const newOil = {
      id: Date.now().toString(),
      name: "",
      note: "media" as Note
    };
    
    setOilsList(prev => [...prev, newOil]);
  };

  const removeOil = (id: string) => {
    setOilsList(prev => prev.filter(oil => oil.id !== id));
  };

  const updateOilName = (id: string, name: string) => {
    setOilsList(prev => 
      prev.map(oil => {
        if (oil.id === id) {
          const detectedNote = detectOilNote(name);
          return { ...oil, name, note: detectedNote };
        }
        return oil;
      })
    );
  };

  const updateOilNote = (id: string, note: Note) => {
    setOilsList(prev => 
      prev.map(oil => oil.id === id ? { ...oil, note } : oil)
    );
  };

  const clearCalculator = () => {
    setCarrierOilQuantity("");
    setTargetAudience("");
    setManualDilution("");
    setOilsList([]);
  };

  // Cálculos unificados
  const calculations = useMemo(() => {
    const carrierQty = parseFloat(carrierOilQuantity);
    const audience = TARGET_AUDIENCES.find(a => a.value === targetAudience);
    
    if (!carrierQty || !audience || carrierQty <= 0 || oilsList.length === 0) {
      return null;
    }

    // Usar diluição manual se fornecida, senão usar padrão da audiência
    const manualDilutionValue = parseFloat(manualDilution);
    const dilutionPercentage = manualDilutionValue && manualDilutionValue > 0 
      ? manualDilutionValue 
      : audience.dilution;

    const totalEssentialOilsML = (carrierQty * dilutionPercentage) / 100;
    
    // Contar óleos por nota
    const noteCount = {
      alta: oilsList.filter(oil => oil.note === "alta").length,
      media: oilsList.filter(oil => oil.note === "media").length,
      baixa: oilsList.filter(oil => oil.note === "baixa").length
    };
    
    // Calcular ml por nota baseado nos percentuais permitidos
    const noteMLs = {
      alta: (totalEssentialOilsML * 15) / 100, // máximo 15%
      media: (totalEssentialOilsML * 80) / 100, // máximo 80%
      baixa: (totalEssentialOilsML * 5) / 100   // máximo 5%
    };
    
    // Distribuir entre os óleos de cada nota
    const oilResults = oilsList.map(oil => {
      const mlForNote = noteMLs[oil.note];
      const countForNote = noteCount[oil.note];
      const mlPerOil = countForNote > 0 ? mlForNote / countForNote : 0;
      const dropsPerOil = mlPerOil * 25; // 25 gotas por mL
      
      return {
        id: oil.id,
        name: oil.name || `Óleo ${oil.note}`,
        note: oil.note,
        mlPerOil: mlPerOil.toFixed(3),
        dropsPerOil: Math.round(dropsPerOil)
      };
    });
    
    // Verificar violações das regras de notas
    const violations = [];
    if (noteCount.alta > 0 && noteMLs.alta > (totalEssentialOilsML * 15) / 100) {
      violations.push("alta");
    }
    if (noteCount.baixa > 0 && noteMLs.baixa > (totalEssentialOilsML * 5) / 100) {
      violations.push("baixa");
    }

    return {
      dilutionPercentage,
      totalEssentialOilsML: totalEssentialOilsML.toFixed(2),
      totalEssentialOilsDrops: Math.round(totalEssentialOilsML * 25),
      noteCount,
      noteMLs: {
        alta: noteMLs.alta.toFixed(3),
        media: noteMLs.media.toFixed(3),
        baixa: noteMLs.baixa.toFixed(3)
      },
      oilResults,
      violations,
      audience: audience.label
    };
  }, [carrierOilQuantity, targetAudience, manualDilution, oilsList]);

  const hasValidInputs = carrierOilQuantity && targetAudience && oilsList.length > 0;

  return (
    <div className="space-y-6">
      {/* Informações Sobre Blends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Beaker className="w-5 h-5" />
            Informações Sobre Blends
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-6">
            <div className="text-muted-foreground">
              <p className="mb-4">
                Misturar óleos essenciais é como criar uma boa música: cada ingrediente tem seu tempo, sua intensidade e seu papel para formar uma harmonia perfeita.
              </p>
              <p className="mb-6">
                Para facilitar essa combinação, os óleos são classificados em três tipos de <strong>notas aromáticas</strong>:
              </p>
            </div>

            <div className="space-y-6">
              {/* Notas Altas */}
              <Card className="p-4 border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🎈</span>
                    <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
                      Notas Altas — As Primeiras a Chegar
                    </h3>
                  </div>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    São os aromas mais leves e frescos, percebidos logo que sentimos a mistura. Elas "abrem" o cheiro do blend, mas evaporam rápido.
                  </p>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    <strong>Exemplos:</strong> limão, laranja, hortelã-pimenta, eucalipto, grapefruit.
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔹</span>
                    <Badge variant="outline" className="border-yellow-500 text-yellow-700 dark:text-yellow-300">
                      Máximo recomendado: 15% da mistura total
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* Notas Médias */}
              <Card className="p-4 border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">💐</span>
                    <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                      Notas Médias — O Coração do Aroma
                    </h3>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    São o meio da fragrância: nem tão voláteis quanto as notas altas, nem tão densas quanto as baixas. São responsáveis por equilibrar o aroma e dar corpo à mistura.
                  </p>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    <strong>Exemplos:</strong> lavanda, camomila, gerânio, alecrim, manjerona.
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔸</span>
                    <Badge variant="outline" className="border-green-500 text-green-700 dark:text-green-300">
                      Máximo recomendado: 80% da mistura total
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* Notas Baixas */}
              <Card className="p-4 border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🌳</span>
                    <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                      Notas Baixas — A Base Fixa e Profunda
                    </h3>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Essas notas são mais densas e duram mais tempo na pele ou no ambiente. Elas "seguram" o aroma do blend por mais tempo, dando profundidade e estabilidade à combinação.
                  </p>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    <strong>Exemplos:</strong> patchouli, mirra, olíbano, ylang-ylang.
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⚫</span>
                    <Badge variant="outline" className="border-blue-500 text-blue-700 dark:text-blue-300">
                      Máximo recomendado: 5% da mistura total
                    </Badge>
                  </div>
                </div>
              </Card>
            </div>

            <Separator />

            {/* Dicas */}
            <Card className="p-4 border-primary/20 bg-primary/5">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-primary">
                    Dicas para um Blend Equilibrado
                  </h3>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    Use <strong>até 5 óleos essenciais</strong> por blend.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    Escolha os óleos pensando no efeito terapêutico <strong>e</strong> na harmonia do aroma.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    Respeite os limites de cada tipo de nota para manter a mistura agradável e segura.
                  </li>
                </ul>
                <p className="text-sm text-muted-foreground mt-4 italic">
                  Criar um blend é uma experiência sensorial e terapêutica. Ao conhecer essas notas e suas proporções, você poderá fazer combinações que não só tratam, mas também encantam.
                </p>
              </div>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Calculadora Unificada */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Calculadora de Blend e Diluição
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Configurações básicas */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="carrier-oil">
                Quantidade de Carreador (mL) *
              </Label>
              <Input
                id="carrier-oil"
                type="number"
                min="1"
                placeholder="Ex: 100"
                value={carrierOilQuantity}
                onChange={(e) => setCarrierOilQuantity(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Volume base do seu blend
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target-audience">
                Público-Alvo *
              </Label>
              <Select value={targetAudience} onValueChange={setTargetAudience}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o público-alvo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="adults">Adultos (≤ 5%)</SelectItem>
                  <SelectItem value="children_5_14">Crianças de 5 a 14 anos (≤ 1,25%)</SelectItem>
                  <SelectItem value="elderly">Idosos (≤ 1,25%)</SelectItem>
                  <SelectItem value="children_over_14">Crianças acima de 14 anos (≤ 5%)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Define a diluição segura
              </p>
            </div>
          </div>

          {/* Campo de diluição manual */}
          {targetAudience && (
            <div className="space-y-2">
              <Label htmlFor="manual-dilution">
                Digite o percentual de diluição desejado (%)
              </Label>
              <Input
                id="manual-dilution"
                type="number"
                step="0.01"
                min="0.01"
                max={TARGET_AUDIENCES.find(a => a.value === targetAudience)?.dilution || 5}
                placeholder={`Ex: ${TARGET_AUDIENCES.find(a => a.value === targetAudience)?.dilution || 2.5}`}
                value={manualDilution}
                onChange={(e) => setManualDilution(e.target.value)}
              />
              {(() => {
                const validation = validateDilution(manualDilution, targetAudience);
                const selectedAudience = TARGET_AUDIENCES.find(a => a.value === targetAudience);
                return (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      A diluição deve estar entre 0,01% e {selectedAudience?.dilution}%, de acordo com o público selecionado.
                    </p>
                    {manualDilution && !validation.isValid && (
                      <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-200 rounded text-xs">
                        <AlertCircle className="w-4 h-4" />
                        {validation.message}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Seção de óleos essenciais */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-base font-semibold">
                Óleos Essenciais ({oilsList.length}/5)
              </Label>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={addOil}
                  disabled={oilsList.length >= 5}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Óleo
                </Button>
                {oilsList.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearCalculator}
                  >
                    Limpar Tudo
                  </Button>
                )}
              </div>
            </div>

            {oilsList.length === 0 && (
              <div className="text-center p-8 text-muted-foreground border-2 border-dashed rounded-lg">
                <Pipette className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Adicione pelo menos um óleo essencial para começar</p>
              </div>
            )}

            {oilsList.map((oil, index) => (
              <Card key={oil.id} className="p-4 bg-muted/30">
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="min-w-fit">
                    Óleo {index + 1}
                  </Badge>
                  
                  <div className="flex-1 grid md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor={`oil-name-${oil.id}`} className="text-sm">
                        Nome (opcional)
                      </Label>
                      <Input
                        id={`oil-name-${oil.id}`}
                        placeholder="Ex: Lavanda"
                        value={oil.name}
                        onChange={(e) => updateOilName(oil.id, e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`oil-note-${oil.id}`} className="text-sm">
                        Nota Aromática
                      </Label>
                      <Select 
                        value={oil.note} 
                        onValueChange={(note: Note) => updateOilNote(oil.id, note)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="alta">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-yellow-500" />
                              Nota Alta
                            </div>
                          </SelectItem>
                          <SelectItem value="media">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-green-500" />
                              Nota Média
                            </div>
                          </SelectItem>
                          <SelectItem value="baixa">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-blue-500" />
                              Nota Baixa
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOil(oil.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Resultados */}
          {calculations ? (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <Label className="text-lg font-semibold">Resultados</Label>
                </div>
                
                {/* Informações gerais */}
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        {calculations.audience}
                      </p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {calculations.dilutionPercentage}% diluição
                      </p>
                    </div>
                  </Card>

                  <Card className="p-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        Total de óleos essenciais
                      </p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                        {calculations.totalEssentialOilsML} mL
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300">
                        ≈ {calculations.totalEssentialOilsDrops} gotas
                      </p>
                    </div>
                  </Card>
                </div>

                {/* Resultados individuais */}
                <Card className="p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      Quantidade por Óleo Essencial:
                    </p>
                    <div className="space-y-2">
                      {calculations.oilResults.map((result, index) => (
                        <div key={result.id} className="flex justify-between items-center p-3 bg-white/50 dark:bg-black/20 rounded">
                          <div className="flex items-center gap-3">
                            <Badge 
                              variant="outline" 
                              className={
                                result.note === "alta" ? "border-yellow-500 text-yellow-700" :
                                result.note === "media" ? "border-green-500 text-green-700" :
                                "border-blue-500 text-blue-700"
                              }
                            >
                              {result.name || `Óleo ${index + 1}`}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              (Nota {result.note === "alta" ? "Alta" : result.note === "media" ? "Média" : "Baixa"})
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-amber-900 dark:text-amber-100">
                              {result.mlPerOil} mL
                            </p>
                            <p className="text-xs text-amber-700 dark:text-amber-300">
                              ≈ {result.dropsPerOil} gotas
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* Composição por Notas Aromáticas */}
                <Card className="p-4 bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-gradient-to-r from-yellow-400 via-green-500 to-blue-600 rounded-full" />
                      <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                        Composição por Notas Aromáticas:
                      </p>
                    </div>
                    
                    <div className="grid gap-3">
                      {/* Nota Alta */}
                      {parseFloat(calculations.noteMLs.alta) > 0 && (
                        <div className="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">🎈</span>
                            <div>
                              <span className="font-medium text-yellow-800 dark:text-yellow-200">Nota Alta</span>
                              <div className="text-xs text-yellow-700 dark:text-yellow-300">
                                {((parseFloat(calculations.noteMLs.alta) / parseFloat(calculations.totalEssentialOilsML)) * 100).toFixed(1)}%
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-yellow-900 dark:text-yellow-100">
                              {calculations.noteMLs.alta} mL
                            </p>
                            <p className="text-xs text-yellow-700 dark:text-yellow-300">
                              ≈ {Math.round(parseFloat(calculations.noteMLs.alta) * 25)} gotas
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Nota Média */}
                      {parseFloat(calculations.noteMLs.media) > 0 && (
                        <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">💐</span>
                            <div>
                              <span className="font-medium text-green-800 dark:text-green-200">Nota Média</span>
                               <div className="text-xs text-green-700 dark:text-green-300">
                                 {((parseFloat(calculations.noteMLs.media) / parseFloat(calculations.totalEssentialOilsML)) * 100).toFixed(1)}%
                               </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-900 dark:text-green-100">
                              {calculations.noteMLs.media} mL
                            </p>
                            <p className="text-xs text-green-700 dark:text-green-300">
                              ≈ {Math.round(parseFloat(calculations.noteMLs.media) * 25)} gotas
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Nota Baixa */}
                      {parseFloat(calculations.noteMLs.baixa) > 0 && (
                        <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">🌳</span>
                            <div>
                              <span className="font-medium text-blue-800 dark:text-blue-200">Nota Baixa</span>
                               <div className="text-xs text-blue-700 dark:text-blue-300">
                                 {((parseFloat(calculations.noteMLs.baixa) / parseFloat(calculations.totalEssentialOilsML)) * 100).toFixed(1)}%
                               </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-blue-900 dark:text-blue-100">
                              {calculations.noteMLs.baixa} mL
                            </p>
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                              ≈ {Math.round(parseFloat(calculations.noteMLs.baixa) * 25)} gotas
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Alertas de limites ultrapassados */}
                    <div className="space-y-2">
                       {(() => {
                         const totalMLFloat = parseFloat(calculations.totalEssentialOilsML);
                         const altaPercent = (parseFloat(calculations.noteMLs.alta) / totalMLFloat) * 100;
                         const mediaPercent = (parseFloat(calculations.noteMLs.media) / totalMLFloat) * 100;
                         const baixaPercent = (parseFloat(calculations.noteMLs.baixa) / totalMLFloat) * 100;
                        
                        const alerts = [];
                        
                        if (altaPercent > 15) {
                          alerts.push("O percentual de nota alta ultrapassa o limite recomendado de 15%. Ajuste a composição para manter o equilíbrio aromático.");
                        }
                        if (mediaPercent > 80) {
                          alerts.push("O percentual de nota média ultrapassa o limite recomendado de 80%. Considere redistribuir entre as outras notas.");
                        }
                        if (baixaPercent > 5) {
                          alerts.push("O percentual de nota baixa ultrapassa o limite recomendado de 5%. Reduza a quantidade para evitar dominância no aroma.");
                        }
                        
                        return alerts.map((alert, index) => (
                          <div key={index} className="flex items-start gap-2 p-2 bg-orange-50 dark:bg-orange-950/20 text-orange-800 dark:text-orange-200 rounded text-xs">
                            <AlertTriangle className="w-4 h-4 mt-0.5" />
                            <span>{alert}</span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </Card>

                {/* Avisos de validação */}
                {calculations.violations.length > 0 && (
                  <Card className="p-4 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                      <div className="text-sm text-red-800 dark:text-red-200">
                        <strong>Atenção:</strong> Algumas proporções podem exceder os limites recomendados. 
                        Considere ajustar a distribuição dos óleos para manter as proporções seguras.
                      </div>
                    </div>
                  </Card>
                )}

                <Card className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Conversão:</strong> Baseado em 25 gotas por mL. Sempre meça os óleos essenciais 
                    com cuidado e adicione gota a gota ao óleo carreador.
                  </p>
                </Card>
              </div>
            </>
          ) : hasValidInputs ? (
            <div className="text-center p-6 text-muted-foreground border-2 border-dashed rounded-lg">
              <Calculator className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Preencha todos os campos para ver os cálculos</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Tabela de Referência */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Diluição Segura - Referência
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            A diluição dos óleos essenciais é fundamental para garantir segurança e eficácia. 
            Abaixo estão as recomendações máximas de diluição por faixa etária e grupo.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border p-3 text-left font-semibold">
                    Público-alvo
                  </th>
                  <th className="border border-border p-3 text-left font-semibold">
                    Diluição segura
                  </th>
                </tr>
              </thead>
              <tbody>
                {DILUTION_TABLE.map((row, index) => (
                  <tr key={index} className="hover:bg-muted/50">
                    <td className="border border-border p-3">
                      {row.public}
                    </td>
                    <td className="border border-border p-3 font-medium">
                      {row.dilution}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Importante:</strong> Estas são diretrizes gerais. Sempre consulte um profissional 
              qualificado antes de usar óleos essenciais, especialmente em crianças, grávidas ou 
              pessoas com condições de saúde específicas.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};