// src/lib/exporters_recipes.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

// ---------- helpers ----------
const toArray = (v: any) => Array.isArray(v) ? v : (v ? [v] : []);
const join = (arr?: (string | null | undefined)[], sep = "; ") =>
  (arr || []).map(s => (s ?? "").trim()).filter(Boolean).join(sep);

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

const filterSummary = (f?: Partial<Filters>) => {
  if (!f) return "Sem filtros.";
  const parts: string[] = [];
  if (f.q) parts.push(`Busca: "${f.q}"`);
  if (f.application?.length) parts.push(`Aplicação: ${f.application.join(", ")}`);
  if (f.difficulty?.length) parts.push(`Dificuldade: ${f.difficulty.join(", ")}`);
  if (f.tags?.length) parts.push(`Tags: ${f.tags.join(", ")}`);
  if (f.intents?.length) parts.push(`Intenções: ${f.intents.join(", ")}`);
  if (f.ingredients?.length) parts.push(`Ingredientes: ${f.ingredients.join(", ")}`);
  if (f.safety?.length) parts.push(`Segurança: ${f.safety.join(", ")}`);
  if (f.prepRange?.length) parts.push(`Tempo: ${f.prepRange.join(", ")}`);
  if (f.dilution?.length) parts.push(`Diluição: ${f.dilution.join(", ")}`);
  if (f.meta?.length) parts.push(`Meta: ${f.meta.join(", ")}`);
  if (f.sort && f.sort !== "relevance") parts.push(`Ordenação: ${f.sort}`);
  return parts.length ? parts.join(" | ") : "Sem filtros.";
};

const stamp = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}`;
};

function downloadBlob(content: BlobPart, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}

// ---------- CSV ----------
export function exportRecipesCSV(rows: Recipe[], filename = `receitas_${stamp()}.csv`) {
  const headers = [
    "id", "name", "purpose", "application", "difficulty", "prep_time", "yield",
    "ingredients", "steps", "dilution_context", "dilution_percent", "dilution_note",
    "validity", "contraindications", "safety_notes", "tags", "references"
  ];
  
  const esc = (s?: string | null) => {
    const v = (s ?? "").replace(/\r?\n/g, " ").replace(/"/g, '""');
    return `"${v}"`;
  };
  
  const line = (r: Recipe) => [
    r.id,
    r.name,
    Array.isArray(r.purpose) ? r.purpose.join("; ") : (r.purpose || ""),
    r.application || "",
    r.difficulty || "",
    r.prep_time || "",
    r.yield || "",
    toArray(r.ingredients).map(formatIngredient).join("; "),
    toArray(r.steps).join("; "),
    r.dilution?.context || "",
    r.dilution?.percent?.toString() || "",
    r.dilution?.note || "",
    r.validity || "",
    toArray(r.contraindications).join("; "),
    toArray(r.safety_notes).join("; "),
    toArray(r.tags).join("; "),
    toArray(r.references).map(ref => ref.title || ref.url || "").filter(Boolean).join("; ")
  ].map(v => esc(String(v)));
  
  const csv = [headers.map(esc).join(","), ...rows.map(r => line(r).join(","))].join("\n");
  downloadBlob(csv, filename, "text/csv;charset=utf-8");
}

// ---------- TXT ----------
export function exportRecipesTXT(rows: Recipe[], f?: Partial<Filters>, filename = `receitas_${stamp()}.txt`): void {
  const header = `Relatório — Receitas Terapêuticas\nGerado em: ${new Date().toLocaleString()}\nResultados: ${rows.length}\nFiltros: ${filterSummary(f)}\n\n`;
  
  const body = rows.map((r, i) => {
    const purpose = Array.isArray(r.purpose) ? r.purpose.join(", ") : (r.purpose || "—");
    const ingredients = toArray(r.ingredients).map(formatIngredient).join("\n  • ");
    const steps = toArray(r.steps).map((step, idx) => `${idx + 1}. ${step}`).join("\n  ");
    const contraindications = toArray(r.contraindications).join("; ");
    const safetyNotes = toArray(r.safety_notes).join("; ");
    const tags = toArray(r.tags).join(", ");
    const references = toArray(r.references).map(ref => ref.title || ref.url || "").filter(Boolean).join("; ");
    
    return [
      `#${i + 1} — ${r.name}`,
      `Propósito: ${purpose}`,
      `Aplicação: ${r.application || "—"} | Dificuldade: ${r.difficulty || "—"}`,
      `Tempo de preparo: ${r.prep_time || "—"} | Rendimento: ${r.yield || "—"}`,
      `Validade: ${r.validity || "—"}`,
      "",
      `Ingredientes:`,
      ingredients ? `  • ${ingredients}` : "  —",
      "",
      ...(toArray(r.steps).length > 0 ? [
        `Modo de preparo:`,
        `  ${steps}`,
        ""
      ] : []),
      ...(r.dilution ? [
        `Diluição (${r.dilution.context || "geral"}): ${r.dilution.percent != null ? `${r.dilution.percent}%` : "—"}${r.dilution.note ? ` - ${r.dilution.note}` : ""}`,
        ""
      ] : []),
      `Contraindicações: ${contraindications || "—"}`,
      `Notas de segurança: ${safetyNotes || "—"}`,
      `Tags: ${tags || "—"}`,
      `Referências: ${references || "—"}`,
      "",
    ].join("\n");
  }).join("\n");
  
  downloadBlob(header + body, filename, "text/plain;charset=utf-8");
}

// ---------- PDF ----------
export async function exportRecipesPDF(rows: Recipe[], f?: Partial<Filters>, filename = `receitas_${stamp()}.pdf`): Promise<void> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  
  const addHeader = () => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Relatório — Receitas Terapêuticas", margin, margin);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, margin, margin + 14);
    doc.text(`Resultados: ${rows.length}`, margin, margin + 28);
    doc.setFontSize(8);
    const filters = doc.splitTextToSize(`Filtros: ${filterSummary(f)}`, pageWidth - margin * 2);
    doc.text(filters, margin, margin + 42);
    doc.setLineWidth(0.5);
    doc.line(margin, margin + 50, pageWidth - margin, margin + 50);
  };
  
  const addFooter = () => {
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Página ${i} / ${pageCount}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 20, { align: "right" });
    }
  };

  addHeader();

  // Tabela-resumo (nome / propósito / aplicação / dificuldade)
  autoTable(doc, {
    startY: margin + 60,
    styles: { fontSize: 9, cellPadding: 4 },
    head: [["Nome", "Propósito", "Aplicação", "Dificuldade"]],
    body: rows.map(r => [
      r.name,
      Array.isArray(r.purpose) ? r.purpose.join(", ") : (r.purpose || "—"),
      r.application || "—",
      r.difficulty || "—",
    ]),
    theme: "striped",
    headStyles: { fillColor: [33, 150, 243], textColor: 255 },
    didDrawPage: (data) => { if (data.pageNumber > 1) addHeader(); }
  });

  // Detalhes por receita (uma seção por registro)
  for (const r of rows) {
    doc.addPage();
    addHeader();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(r.name, margin, margin + 70);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    const kv = (k: string, v: string) => ({ col1: k, col2: v || "—" });

    const purpose = Array.isArray(r.purpose) ? r.purpose.join(", ") : (r.purpose || "");
    const ingredients = toArray(r.ingredients).map(formatIngredient).join("\n");
    const steps = toArray(r.steps).map((step, idx) => `${idx + 1}. ${step}`).join("\n");
    const contraindications = toArray(r.contraindications).join("; ");
    const safetyNotes = toArray(r.safety_notes).join("; ");
    const tags = toArray(r.tags).join(", ");
    const references = toArray(r.references).map(ref => ref.title || ref.url || "").filter(Boolean).join("; ");
    const dilution = r.dilution ? 
      `${r.dilution.context || "Geral"}: ${r.dilution.percent != null ? `${r.dilution.percent}%` : "—"}${r.dilution.note ? ` - ${r.dilution.note}` : ""}` 
      : "";

    const linhas = [
      kv("Propósito", purpose),
      kv("Aplicação", r.application || ""),
      kv("Dificuldade", r.difficulty || ""),
      kv("Tempo de preparo", r.prep_time || ""),
      kv("Rendimento", r.yield || ""),
      kv("Validade", r.validity || ""),
      kv("Ingredientes", ingredients),
      ...(toArray(r.steps).length > 0 ? [kv("Modo de preparo", steps)] : []),
      ...(r.dilution ? [kv("Diluição", dilution)] : []),
      kv("Contraindicações", contraindications),
      kv("Notas de segurança", safetyNotes),
      kv("Tags", tags),
      kv("Referências", references),
    ];

    autoTable(doc, {
      startY: margin + 80,
      styles: { fontSize: 9, cellPadding: 4 },
      body: linhas.map(l => [l.col1, l.col2]),
      theme: "grid",
      columnStyles: { 
        0: { cellWidth: 120, fontStyle: "bold" }, 
        1: { cellWidth: pageWidth - margin * 2 - 120 } 
      },
      didDrawPage: () => { /* header already drawn */ }
    });
  }

  addFooter();
  doc.save(filename);
}