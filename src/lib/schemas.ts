import { z } from "zod";

// Constituinte e diluição
export const ConstituinteSchema = z.object({
  nome: z.string().min(1),
  percentual: z.union([
    z.number().min(0).max(100),
    z.string().transform((val) => {
      if (val === "" || val == null) return undefined;
      const num = Number(val);
      return Number.isFinite(num) ? num : undefined;
    }),
    z.null(),
    z.undefined()
  ]).optional().transform((val) => val === null ? undefined : val)
}).strict();

export const DiluicoesSchema = z.object({
  geral: z.string().min(1).nullish(),
  valores_percent: z.array(z.number().min(0).max(100)).nullish()
}).strict();

// OIL (array de objetos | arquivo oils_catalog_normalized.min.json)
export const OilSchema = z.object({
  id: z.string().min(1),
  tipo_produto: z.string().min(1),              // ex.: "essential_oil"
  nome_pt: z.string().min(1),
  nome_latim: z.string().optional().nullable(),
  categoria: z.string().optional().nullable(),
  familia_botanica: z.string().optional().nullable(),
  familia_olfativa: z.string().optional().nullable(),
  familia_olfativa_raw: z.string().optional().nullable(),
  parte_usada: z.string().optional().nullable(),
  metodo_extracao: z.string().optional().nullable(),
  metodo_extracao_raw: z.string().optional().nullable(),
  principais_constituintes: z.array(ConstituinteSchema).optional(),
  efeitos_esperados: z.array(z.string()).optional(),
  aplicacoes_sugeridas: z.array(z.string()).optional(),
  veiculos_recomendados: z.array(z.string()).optional(),
  propriedades_tradicionais: z.string().optional().nullable(),
  etnobotanica_geral: z.string().optional().nullable(),
  precaucoes: z.string().optional().nullable(),
  contraindicacoes: z.string().optional().nullable(),
  notas_rapidas_seguranca: z.string().optional().nullable(),
  uso_pele_sensivel: z.boolean().optional().nullable(),
  uso_ambiente_clinico: z.boolean().optional().nullable(),
  uso_couro_cabeludo: z.boolean().optional().nullable(),
  fototoxico: z.boolean().optional().nullable(),
  sensibilizante: z.boolean().optional().nullable(),
  alto_teor_cetonas: z.boolean().optional().nullable(),
  alto_1_8_cineole: z.boolean().optional().nullable(),
  alto_fenois: z.boolean().optional().nullable(),
  publicos_restritos: z.object({
    gravidez: z.boolean().optional(),
    lactacao: z.boolean().optional(),
    criancas_min_idade: z.number().optional().nullable(),
    epilepsia: z.boolean().optional(),
    asma: z.boolean().optional()
  }).partial().optional(),
  diluicoes: DiluicoesSchema.optional().nullable(),
  sinergias_sugeridas: z.array(z.string()).optional(),
  incompatibilidades_praticas: z.array(z.string()).optional(),
  fontes: z.array(z.object({ url: z.string().url().optional(), ref: z.string().optional() }).strict()).optional(),
  regiao_origem: z.string().optional().nullable()
}).strict();

// RECIPE (dentro de recipes[])
export const IngredientSchema = z.union([
  z.object({ type: z.literal("essential_oil"), name_pt: z.string().min(1), latin: z.string().optional(), drops: z.number().int().min(0).optional() }).strict(),
  z.object({ type: z.enum(["carrier_oil","solvent","solubilizer","water"]), name_pt: z.string().min(1), amount_ml: z.number().min(0).optional() }).strict(),
  // tolerância a strings simples na importação (convertidas no form)
  z.string()
]);

export const RecipeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  purpose: z.array(z.string()).optional(),
  application: z.string().min(1),
  difficulty: z.string().min(1),
  prep_time: z.string().optional(),
  yield: z.string().optional(),
  ingredients: z.array(IngredientSchema).min(1),
  steps: z.array(z.string()).min(1),
  dilution: z.object({ context: z.string().optional(), percent: z.number().min(0).max(100).optional(), note: z.string().optional() }).partial().optional(),
  validity: z.string().optional(),
  contraindications: z.array(z.string()).optional(),
  safety_notes: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  references: z.array(z.object({ title: z.string().optional(), url: z.string().url().optional() }).strict()).optional()
}).strict();

export const RecipesRootSchema = z.object({
  version: z.string().min(1),
  updated_at: z.string().min(1),
  source_notice: z.string().min(1),
  recipes: z.array(RecipeSchema)
}).strict();

// Tipos exportados
export type Oil = z.infer<typeof OilSchema>;
export type Recipe = z.infer<typeof RecipeSchema>;
export type RecipesRoot = z.infer<typeof RecipesRootSchema>;
export type Constituinte = z.infer<typeof ConstituinteSchema>;
export type Ingredient = z.infer<typeof IngredientSchema>;