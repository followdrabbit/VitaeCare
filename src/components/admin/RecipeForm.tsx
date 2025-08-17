import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { Recipe } from '@/services/dataStore';
import { RecipeSchema, Ingredient } from '@/lib/schemas';

interface RecipeFormProps {
  recipe: Recipe | null;
  onSave: (recipe: Recipe) => void;
  onCancel: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

export function RecipeForm({ recipe, onSave, onCancel, onDirtyChange }: RecipeFormProps) {
  const isEditing = !!recipe;
  
  const form = useForm<Recipe>({
    // Remove schema validation to avoid type conflicts  
    defaultValues: recipe || {
      id: '',
      name: '',
      purpose: [],
      application: '',
      difficulty: '',
      prep_time: '',
      yield: '',
      ingredients: [{ type: 'essential_oil', name_pt: '', drops: 0 }],
      steps: [''],
      dilution: { context: '', percent: undefined, note: '' },
      validity: '',
      contraindications: [],
      safety_notes: [],
      tags: [],
      references: []
    }
  });

  // Atualizar form quando recipe changes (importante para edição)
  useEffect(() => {
    if (recipe) {
      console.log('🔄 Carregando dados da receita para edição:', recipe);
      form.reset(recipe);
    }
  }, [recipe, form]);

  // Track dirty state
  useEffect(() => {
    const subscription = form.watch(() => {
      if (onDirtyChange) {
        onDirtyChange(form.formState.isDirty);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, onDirtyChange]);

  const { fields: purposeFields, append: appendPurpose, remove: removePurpose } = useFieldArray({
    control: form.control,
    name: 'purpose' as any
  });

  const { fields: ingredientFields, append: appendIngredient, remove: removeIngredient } = useFieldArray({
    control: form.control,
    name: 'ingredients'
  });

  const { fields: stepFields, append: appendStep, remove: removeStep } = useFieldArray({
    control: form.control,
    name: 'steps' as any
  });

  const { fields: contraindicationFields, append: appendContraindication, remove: removeContraindication } = useFieldArray({
    control: form.control,
    name: 'contraindications' as any
  });

  const { fields: safetyFields, append: appendSafety, remove: removeSafety } = useFieldArray({
    control: form.control,
    name: 'safety_notes' as any
  });

  const { fields: tagFields, append: appendTag, remove: removeTag } = useFieldArray({
    control: form.control,
    name: 'tags' as any
  });

  const { fields: referenceFields, append: appendReference, remove: removeReference } = useFieldArray({
    control: form.control,
    name: 'references'
  });

  const onSubmit = (data: Recipe) => {
    // Limpar campos vazios
    const cleanedData = {
      ...data,
      purpose: Array.isArray(data.purpose) ? data.purpose.filter(p => p?.trim()) : (data.purpose ? [data.purpose] : []),
      ingredients: data.ingredients.filter(ing => {
        if (typeof ing === 'string') return ing.trim();
        return ing.name_pt?.trim();
      }),
      steps: Array.isArray(data.steps) ? data.steps.filter(s => s?.trim()) : (data.steps ? [data.steps] : []),
      contraindications: Array.isArray(data.contraindications) ? data.contraindications.filter(c => c?.trim()) : (data.contraindications ? [data.contraindications] : []),
      safety_notes: Array.isArray(data.safety_notes) ? data.safety_notes.filter(s => s?.trim()) : (data.safety_notes ? [data.safety_notes] : []),
      tags: Array.isArray(data.tags) ? data.tags.filter(t => t?.trim()) : (data.tags ? [data.tags] : []),
      references: data.references?.filter(r => r.title?.trim() || r.url?.trim()) || [],
      dilution: data.dilution?.context?.trim() || data.dilution?.percent != null || data.dilution?.note?.trim() 
        ? data.dilution 
        : undefined
    };
    
    onSave(cleanedData);
  };

  const addIngredient = (type: string) => {
    if (type === 'essential_oil') {
      appendIngredient({ type: 'essential_oil', name_pt: '', latin: '', drops: 0 });
    } else {
      appendIngredient({ type: type as any, name_pt: '', amount_ml: 0 });
    }
  };

  return (
    <Sheet open onOpenChange={onCancel}>
      <SheetContent className="sm:max-w-4xl overflow-hidden">
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Editar Receita' : 'Nova Receita'}</SheetTitle>
          <SheetDescription>
            {isEditing ? 'Edite as informações da receita' : 'Preencha as informações da nova receita'}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-6">
              {/* Informações Básicas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações Básicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID *</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isEditing} placeholder="ex: roll-on-relaxante" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="ex: Roll-on Relaxante" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="application"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Aplicação *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a aplicação" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Roll-on">Roll-on</SelectItem>
                              <SelectItem value="Spray">Spray</SelectItem>
                              <SelectItem value="Difusor">Difusor</SelectItem>
                              <SelectItem value="Massagem">Massagem</SelectItem>
                              <SelectItem value="Banho">Banho</SelectItem>
                              <SelectItem value="Compressa">Compressa</SelectItem>
                              <SelectItem value="Inalação">Inalação</SelectItem>
                              <SelectItem value="Sérum">Sérum</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="difficulty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dificuldade *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a dificuldade" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Iniciante">Iniciante</SelectItem>
                              <SelectItem value="Intermediário">Intermediário</SelectItem>
                              <SelectItem value="Avançado">Avançado</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="prep_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tempo de Preparo</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="ex: 5 minutos" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="yield"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rendimento</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="ex: 10ml" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Propósitos */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Propósitos</CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendPurpose('')}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {purposeFields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-3">
                      <Input
                        {...form.register(`purpose.${index}`)}
                        placeholder="ex: Relaxamento"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePurpose(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Ingredientes */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Ingredientes *</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addIngredient('essential_oil')}
                      >
                        + Óleo Essencial
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addIngredient('carrier_oil')}
                      >
                        + Óleo Carreador
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addIngredient('solvent')}
                      >
                        + Solvente
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {ingredientFields.map((field, index) => {
                    const ingredient = form.watch(`ingredients.${index}`);
                    const isEssentialOil = typeof ingredient === 'object' && ingredient.type === 'essential_oil';
                    
                    return (
                      <div key={field.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <Label className="font-medium">
                            {isEssentialOil ? 'Óleo Essencial' : 'Outro Ingrediente'}
                          </Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeIngredient(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Nome (PT) *</Label>
                            <Input
                              {...form.register(`ingredients.${index}.name_pt`)}
                              placeholder="ex: Lavanda"
                            />
                          </div>
                          
                          {isEssentialOil ? (
                            <>
                              <div>
                                <Label>Nome Latim</Label>
                                <Input
                                  {...form.register(`ingredients.${index}.latin`)}
                                  placeholder="ex: Lavandula angustifolia"
                                />
                              </div>
                              <div>
                                <Label>Gotas</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  {...form.register(`ingredients.${index}.drops`, { valueAsNumber: true })}
                                  placeholder="0"
                                />
                              </div>
                            </>
                          ) : (
                            <div>
                              <Label>Quantidade (ml)</Label>
                              <Input
                                type="number"
                                step="0.1"
                                min="0"
                                {...form.register(`ingredients.${index}.amount_ml`, { valueAsNumber: true })}
                                placeholder="0.0"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Modo de Preparo */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Modo de Preparo *</CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendStep('')}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Passo
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stepFields.map((field, index) => (
                    <div key={field.id} className="flex items-start gap-3">
                      <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mt-1">
                        {index + 1}
                      </div>
                      <Textarea
                        {...form.register(`steps.${index}`)}
                        placeholder="Descreva o passo..."
                        className="flex-1"
                        rows={2}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStep(index)}
                        className="mt-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Diluição */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Diluição</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="dilution.context"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contexto</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="ex: Para uso tópico" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dilution.percent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Percentual (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              value={field.value || ''}
                              placeholder="2.0"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="dilution.note"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Observações sobre a diluição..." rows={2} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Botões de ação */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onCancel}>
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button type="submit">
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}