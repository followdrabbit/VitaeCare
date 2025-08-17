import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { Oil } from '@/services/dataStore';
import { OilSchema, Constituinte } from '@/lib/schemas';

interface OilFormProps {
  oil: Oil | null;
  onSave: (oil: Oil) => void;
  onCancel: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

export function OilForm({ oil, onSave, onCancel, onDirtyChange }: OilFormProps) {
  const isEditing = !!oil;
  
  const form = useForm<Oil>({
    // Remove schema validation to avoid type conflicts
    defaultValues: oil || {
      id: '',
      tipo_produto: 'essential_oil',
      nome_pt: '',
      nome_latim: null,
      categoria: null,
      familia_botanica: null,
      familia_olfativa: null,
      familia_olfativa_raw: null,
      parte_usada: null,
      metodo_extracao: null,
      metodo_extracao_raw: null,
      principais_constituintes: [],
      efeitos_esperados: [],
      aplicacoes_sugeridas: [],
      veiculos_recomendados: [],
      propriedades_tradicionais: null,
      etnobotanica_geral: null,
      precaucoes: null,
      contraindicacoes: null,
      notas_rapidas_seguranca: null,
      sinergias_sugeridas: [],
      incompatibilidades_praticas: [],
      fontes: [],
      regiao_origem: null,
      publicos_restritos: {
        gravidez: false,
        lactacao: false,
        epilepsia: false,
        asma: false,
        criancas_min_idade: null
      },
      diluicoes: {
        geral: null,
        valores_percent: []
      },
      uso_pele_sensivel: false,
      uso_ambiente_clinico: false,
      uso_couro_cabeludo: false,
      fototoxico: false,
      sensibilizante: false
    }
  });

  // Atualizar form quando oil changes (importante para edição)
  useEffect(() => {
    if (oil) {
      console.log('🔄 Carregando dados do óleo para edição:', oil);
      form.reset(oil);
    }
  }, [oil, form]);

  // Track dirty state
  useEffect(() => {
    const subscription = form.watch(() => {
      if (onDirtyChange) {
        onDirtyChange(form.formState.isDirty);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, onDirtyChange]);

  const { fields: constituintesFields, append: appendConstituinte, remove: removeConstituinte } = useFieldArray({
    control: form.control,
    name: 'principais_constituintes'
  });

  const { fields: efeitosFields, append: appendEfeito, remove: removeEfeito } = useFieldArray({
    control: form.control,
    name: 'efeitos_esperados' as any
  });

  const { fields: aplicacoesFields, append: appendAplicacao, remove: removeAplicacao } = useFieldArray({
    control: form.control,
    name: 'aplicacoes_sugeridas' as any
  });

  const { fields: veiculosFields, append: appendVeiculo, remove: removeVeiculo } = useFieldArray({
    control: form.control,
    name: 'veiculos_recomendados' as any
  });

  const { fields: sinergiasFields, append: appendSinergia, remove: removeSinergia } = useFieldArray({
    control: form.control,
    name: 'sinergias_sugeridas' as any
  });

  const { fields: incompatibilidadesFields, append: appendIncompatibilidade, remove: removeIncompatibilidade } = useFieldArray({
    control: form.control,
    name: 'incompatibilidades_praticas' as any
  });

  const { fields: fontesFields, append: appendFonte, remove: removeFonte } = useFieldArray({
    control: form.control,
    name: 'fontes'
  });

  const { fields: percentFields, append: appendPercent, remove: removePercent } = useFieldArray({
    control: form.control,
    name: 'diluicoes.valores_percent' as any
  });

  const onSubmit = (data: Oil) => {
    console.log('🔴 OilForm onSubmit chamado com dados:', data);
    
    // Corrigir NaN nos percentuais dos constituintes
    const fixedConstituintes = data.principais_constituintes?.map(c => ({
      ...c,
      percentual: isNaN(c.percentual as any) || c.percentual === null || c.percentual === undefined ? null : Number(c.percentual)
    })) || [];
    
    // Corrigir NaN nos valores de diluição
    const fixedPercents = data.diluicoes?.valores_percent?.map(p => {
      const num = Number(p);
      return isNaN(num) ? null : num;
    }).filter(p => p !== null) || [];
    
    // Limpar campos vazios e nulos
    const cleanedData = {
      ...data,
      nome_latim: data.nome_latim || null,
      categoria: data.categoria || null,
      familia_botanica: data.familia_botanica || null,
      familia_olfativa: data.familia_olfativa || null,
      parte_usada: data.parte_usada || null,
      metodo_extracao: data.metodo_extracao || null,
      propriedades_tradicionais: data.propriedades_tradicionais || null,
      etnobotanica_geral: data.etnobotanica_geral || null,
      precaucoes: data.precaucoes || null,
      contraindicacoes: data.contraindicacoes || null,
      notas_rapidas_seguranca: data.notas_rapidas_seguranca || null,
      regiao_origem: data.regiao_origem || null,
      principais_constituintes: fixedConstituintes.filter(c => c.nome?.trim()),
      efeitos_esperados: data.efeitos_esperados?.filter(e => e?.trim()) || [],
      aplicacoes_sugeridas: data.aplicacoes_sugeridas?.filter(a => a?.trim()) || [],
      veiculos_recomendados: data.veiculos_recomendados?.filter(v => v?.trim()) || [],
      sinergias_sugeridas: data.sinergias_sugeridas?.filter(s => s?.trim()) || [],
      incompatibilidades_praticas: data.incompatibilidades_praticas?.filter(i => i?.trim()) || [],
      fontes: data.fontes?.filter(f => f.ref?.trim() || f.url?.trim()) || [],
      diluicoes: data.diluicoes?.geral?.trim() || fixedPercents.length ? {
        geral: data.diluicoes.geral?.trim() || null,
        valores_percent: fixedPercents
      } : null
    };
    
    console.log('🔴 OilForm chamando onSave com dados limpos:', cleanedData);
    onSave(cleanedData);
  };

  return (
    <Sheet open onOpenChange={onCancel}>
      <SheetContent className="sm:max-w-4xl overflow-hidden">
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Editar Óleo' : 'Novo Óleo'}</SheetTitle>
          <SheetDescription>
            {isEditing ? 'Edite as informações do óleo essencial' : 'Preencha as informações do novo óleo essencial'}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
              console.log('🔴 Erros de validação do formulário:', errors);
              console.log('🔴 Estado do formulário:', form.formState);
            })} className="space-y-6 pb-6">
              {/* Informações Básicas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações Básicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ID *</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isEditing} placeholder="ex: lavanda-vera" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tipo_produto"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Produto *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="ex: essential_oil" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="nome_pt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome em Português *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="ex: Lavanda Vera" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nome_latim"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Latim</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="ex: Lavandula angustifolia" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="familia_botanica"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Família Botânica</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="ex: Lamiaceae" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="familia_olfativa"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Família Olfativa</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="ex: Floral" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="parte_usada"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Parte Usada</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="ex: Flores" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="metodo_extracao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Método de Extração</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="ex: Destilação a vapor" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Principais Constituintes */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Principais Constituintes</CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendConstituinte({ nome: '', percentual: null })}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {constituintesFields.map((field, index) => (
                    <div key={field.id} className="flex items-end gap-3">
                      <div className="flex-1">
                        <Label>Nome</Label>
                        <Input
                          {...form.register(`principais_constituintes.${index}.nome`)}
                          placeholder="ex: Linalol"
                        />
                      </div>
                      <div className="w-24">
                        <Label>%</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          {...form.register(`principais_constituintes.${index}.percentual`, { 
                            setValueAs: (value) => {
                              if (value === '' || value === null || value === undefined) return null;
                              const num = Number(value);
                              return isNaN(num) ? null : num;
                            }
                          })}
                          placeholder="0.00"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeConstituinte(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Propriedades de Segurança */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Propriedades de Segurança</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <FormField
                        control={form.control}
                        name="fototoxico"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel>Fototóxico</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="sensibilizante"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel>Sensibilizante</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="uso_pele_sensivel"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel>Uso em pele sensível</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="uso_ambiente_clinico"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel>Uso em ambiente clínico</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="uso_couro_cabeludo"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel>Uso no couro cabeludo</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-3">Públicos com Restrições</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="publicos_restritos.gravidez"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel>Gravidez</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="publicos_restritos.lactacao"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel>Lactação</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="publicos_restritos.epilepsia"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel>Epilepsia</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="publicos_restritos.asma"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel>Asma</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="mt-3">
                      <FormField
                        control={form.control}
                        name="publicos_restritos.criancas_min_idade"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Idade mínima para crianças (meses)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                                value={field.value || ''}
                                placeholder="ex: 36"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Botões de ação */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onCancel}>
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  <Save className="w-4 h-4 mr-2" />
                  {form.formState.isSubmitting ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}