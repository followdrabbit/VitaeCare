import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { Oil, Recipe, RecipesRoot } from '@/services/dataStore';
import { OilSchema, RecipeSchema, RecipesRootSchema } from '@/lib/schemas';
import { coerceIncomingRecipes, coerceIncomingOils } from '@/lib/jsonClient';
import { z } from 'zod';

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  type: 'oils' | 'recipes';
  currentData: Oil[] | { recipes: Recipe[] };
  onImport: (mode: 'replace' | 'merge', data: any) => Promise<void>;
  onExportBackup: () => void;
}

interface ValidationResult {
  isValid: boolean;
  data?: any;
  errors: string[];
  summary?: {
    total: number;
    added: number;
    updated: number;
    kept: number;
    duplicates: string[];
  };
}

export function ImportDialog({ open, onClose, type, currentData, onImport, onExportBackup }: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'replace' | 'merge'>('merge');
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    
    try {
      const text = await selectedFile.text();
      const data = JSON.parse(text);
      
      const result = validateImportData(data);
      setValidation(result);
    } catch (error) {
      setValidation({
        isValid: false,
        errors: ['Arquivo JSON inválido ou corrompido'],
      });
    }
  };

  const validateImportData = (data: any): ValidationResult => {
    const errors: string[] = [];
    
    try {
      if (type === 'oils') {
        // Aplicar coerção robusta (mesmo processo do carregamento)
        const coerced = coerceIncomingOils(data);
        
        if (!Array.isArray(coerced) || coerced.length === 0) {
          errors.push('Arquivo de óleos deve conter dados válidos em formato array ou {oils: [...]}');
          return { isValid: false, errors };
        }

        // Sanitizar percentuais após coerção
        const sanitizedData = coerced.map((item: any) => ({
          ...item,
          principais_constituintes: (item.principais_constituintes ?? []).map((c: any) => ({
            ...c,
            // Converter null/"" para undefined; strings numéricas para número
            percentual: (c?.percentual == null || c?.percentual === "") 
              ? undefined 
              : (Number.isFinite(+c.percentual) ? +c.percentual : c.percentual)
          }))
        }));

        // Validar cada item
        const validatedData: Oil[] = [];
        const seenIds = new Set<string>();
        const duplicates: string[] = [];

        sanitizedData.forEach((item: any, index: number) => {
          const result = OilSchema.safeParse(item);
          if (result.success) {
            const validItem = result.data;
            if (seenIds.has(validItem.id)) {
              duplicates.push(validItem.id);
            } else {
              seenIds.add(validItem.id);
              validatedData.push(validItem);
            }
          } else {
            const issues = result.error.issues.map(iss => {
              const path = iss.path.join('.');
              return `${path ? `(${path}) ` : ''}${iss.message}`;
            });
            errors.push(`Item ${index + 1}: ${issues.join(' | ')}`);
          }
        });

        if (duplicates.length > 0) {
          errors.push(`IDs duplicados no arquivo: ${duplicates.join(', ')}`);
        }

        if (errors.length > 0) {
          return { isValid: false, errors };
        }

        // Calculate impact - simple merge logic for oils
        const currentOils = Array.isArray(currentData) ? currentData : [];
        const existingIds = new Set(currentOils.map(oil => oil.id));
        const duplicateIds: string[] = [];
        const newIds = new Set<string>();
        
        validatedData.forEach(oil => {
          if (newIds.has(oil.id)) {
            duplicateIds.push(oil.id);
          } else {
            newIds.add(oil.id);
          }
        });
        
        const added = validatedData.filter(oil => !existingIds.has(oil.id)).length;
        const updated = validatedData.filter(oil => existingIds.has(oil.id)).length;
        const kept = currentOils.length - updated;
        
        const mergeSummary = {
          total: validatedData.length,
          added,
          updated,
          kept,
          duplicates: duplicateIds
        };
        
        return {
          isValid: true,
          data: validatedData,
          errors: [],
          summary: {
            total: validatedData.length,
            added: mergeSummary.added,
            updated: mergeSummary.updated,
            kept: mergeSummary.kept,
            duplicates: []
          }
        };

      } else {
        // Receitas - aceita objeto root ou array
        let recipesData: Recipe[];
        
        if (Array.isArray(data)) {
          recipesData = data;
        } else {
          try {
            RecipesRootSchema.parse(data);
            recipesData = data.recipes || [];
          } catch {
            errors.push('Arquivo de receitas deve conter {recipes: [...]} ou [...]');
            return { isValid: false, errors };
          }
        }

        // Validar receitas
        const validatedRecipes: Recipe[] = [];
        const seenIds = new Set<string>();
        const duplicates: string[] = [];

        recipesData.forEach((recipe, index) => {
          try {
            const validRecipe = RecipeSchema.parse(recipe);
            if (seenIds.has(validRecipe.id)) {
              duplicates.push(validRecipe.id);
            } else {
              seenIds.add(validRecipe.id);
              validatedRecipes.push(validRecipe);
            }
          } catch (err) {
            if (err instanceof z.ZodError) {
              errors.push(`Receita ${index + 1}: ${err.issues.map(e => e.message).join(', ')}`);
            }
          }
        });

        if (duplicates.length > 0) {
          errors.push(`IDs duplicados no arquivo: ${duplicates.join(', ')}`);
        }

        if (errors.length > 0) {
          return { isValid: false, errors };
        }

        // Calculate impact - simple merge logic for recipes
        const currentRecipes = Array.isArray(currentData) ? [] : (currentData.recipes || []);
        const existingIds = new Set(currentRecipes.map(recipe => String(recipe.id)));
        const duplicateIds: string[] = [];
        const newIds = new Set<string>();
        
        validatedRecipes.forEach(recipe => {
          const recipeId = String(recipe.id);
          if (newIds.has(recipeId)) {
            duplicateIds.push(recipeId);
          } else {
            newIds.add(recipeId);
          }
        });
        
        const added = validatedRecipes.filter(recipe => !existingIds.has(String(recipe.id))).length;
        const updated = validatedRecipes.filter(recipe => existingIds.has(String(recipe.id))).length;
        const kept = currentRecipes.length - updated;
        
        const mergeSummary = {
          total: validatedRecipes.length,
          added,
          updated,
          kept,
          duplicates: duplicateIds
        };
        
        return {
          isValid: true,
          data: Array.isArray(data) ? validatedRecipes : data,
          errors: [],
          summary: {
            total: validatedRecipes.length,
            added: mergeSummary.added,
            updated: mergeSummary.updated,
            kept: mergeSummary.kept,
            duplicates: []
          }
        };
      }
    } catch (error) {
      return {
        isValid: false,
        errors: ['Erro inesperado na validação: ' + (error as Error).message]
      };
    }
  };

  const handleImport = async () => {
    if (!validation?.isValid || !validation.data) return;

    setImporting(true);
    try {
      await onImport(mode, validation.data);
      onClose();
      resetState();
    } catch (error) {
      // Error already handled by parent component
    } finally {
      setImporting(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setMode('merge');
    setValidation(null);
    setImporting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    if (!importing) {
      resetState();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Importar {type === 'oils' ? 'Óleos Essenciais' : 'Receitas'}
          </DialogTitle>
          <DialogDescription>
            Carregue um arquivo JSON para importar dados. Você pode substituir ou mesclar com os dados existentes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload */}
          <div className="space-y-2">
            <Label htmlFor="file-upload">Selecionar arquivo JSON</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file-upload"
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                disabled={importing}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={onExportBackup}
                disabled={importing}
              >
                <Download className="w-4 h-4 mr-2" />
                Backup
              </Button>
            </div>
          </div>

          {/* Validação */}
          {validation && (
            <div className="space-y-3">
              {validation.isValid ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Arquivo válido! {validation.summary?.total} {type === 'oils' ? 'óleos' : 'receitas'} detectados.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive" role="alert">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-medium">Erros encontrados:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {validation.errors.map((error, index) => (
                          <li key={index} className="text-sm">{error}</li>
                        ))}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Resumo do impacto */}
              {validation.isValid && validation.summary && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Resumo do Impacto</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">
                        Total: {validation.summary.total}
                      </Badge>
                      <Badge variant="outline" className="text-green-600">
                        Novos: {validation.summary.added}
                      </Badge>
                      <Badge variant="outline" className="text-blue-600">
                        Atualizados: {validation.summary.updated}
                      </Badge>
                      {mode === 'merge' && (
                        <Badge variant="outline" className="text-gray-600">
                          Mantidos: {validation.summary.kept}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Estratégia */}
          {validation?.isValid && (
            <div className="space-y-3">
              <Label>Estratégia de Importação</Label>
              <RadioGroup value={mode} onValueChange={(value) => setMode(value as 'replace' | 'merge')}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="replace" id="replace" />
                  <Label htmlFor="replace" className="cursor-pointer">
                    <div>
                      <div className="font-medium">Substituir base (overwrite)</div>
                      <div className="text-sm text-muted-foreground">
                        Remove todos os dados existentes e substitui pelo arquivo importado
                      </div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="merge" id="merge" />
                  <Label htmlFor="merge" className="cursor-pointer">
                    <div>
                      <div className="font-medium">Mesclar conteúdo (upsert por ID)</div>
                      <div className="text-sm text-muted-foreground">
                        Adiciona novos itens e atualiza existentes, mantém dados não importados
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={importing}>
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={!validation?.isValid || importing}
            className="min-w-[100px]"
          >
            {importing ? (
              <>
                <Upload className="w-4 h-4 mr-2 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Importar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}