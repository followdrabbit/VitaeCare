// src/lib/exporters.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type Constituinte = { nome: string; percentual?: number | null };
export type Diluicoes = { geral?: string | null; valores_percent?: number[] | null };
export type Publicos = { gravidez?: boolean; lactacao?: boolean; criancas_min_idade?: number|null; epilepsia?: boolean; asma?: boolean };

export type Oil = {
  id: string;
  tipo_produto?: string | null;
  nome_pt: string;
  nome_latim?: string | null;
  categoria?: string | null;
  familia_botanica?: string | null;
  familia_olfativa?: string | null;
  familia_olfativa_raw?: string | null;
  parte_usada?: string | null;
  metodo_extracao?: string | null;
  metodo_extracao_raw?: string | null;
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
  alto_teor_cetonas?: boolean | null;
  alto_1_8_cineole?: boolean | null;
  alto_fenois?: boolean | null;
  publicos_restritos?: Publicos;
  diluicoes?: Diluicoes | null;
  sinergias_sugeridas?: string[];
  incompatibilidades_praticas?: string[];
  fontes?: Array<{ url?: string; ref?: string }>;
  regiao_origem?: string | null;
};

export type Filters = Partial<{
  q: string;
  intents: string[];
  apps: string[];
  safe: string[];
  publics: string[];
  constituintes: string[];
  tipo: string[];
  famBot: string[];
  famOlf: string[];
  parte: string[];
  metodo: string[];
  veiculos: string[];
  regiao: string[];
  sort: "relevance" | "name" | "category" | "family";
}>;

// ---------- helpers ----------
const fmtYesNo = (v?: boolean | null) => v === true ? "Sim" : v === false ? "Não" : "—";
const join = (arr?: (string | null | undefined)[], sep = "; ") =>
  (arr || []).map(s => (s ?? "").trim()).filter(Boolean).join(sep);
const fmtConstituintes = (list?: Constituinte[]) =>
  (list || []).map(c => c.percentual != null ? `${c.nome} (${c.percentual}%)` : c.nome).join("; ");

const filterSummary = (f?: Filters) => {
  if (!f) return "Sem filtros.";
  const parts: string[] = [];
  if (f.q) parts.push(`Busca: "${f.q}"`);
  if (f.intents?.length) parts.push(`Intenções: ${f.intents.join(", ")}`);
  if (f.apps?.length) parts.push(`Aplicações: ${f.apps.join(", ")}`);
  if (f.safe?.length) parts.push(`Segurança: ${f.safe.join(", ")}`);
  if (f.publics?.length) parts.push(`Públicos: ${f.publics.join(", ")}`);
  if (f.constituintes?.length) parts.push(`Constituintes: ${f.constituintes.join(", ")}`);
  if (f.tipo?.length) parts.push(`Tipo: ${f.tipo.join(", ")}`);
  if (f.famBot?.length) parts.push(`Família Botânica: ${f.famBot.join(", ")}`);
  if (f.famOlf?.length) parts.push(`Família Olfativa: ${f.famOlf.join(", ")}`);
  if (f.parte?.length) parts.push(`Parte usada: ${f.parte.join(", ")}`);
  if (f.metodo?.length) parts.push(`Método: ${f.metodo.join(", ")}`);
  if (f.veiculos?.length) parts.push(`Veículos: ${f.veiculos.join(", ")}`);
  if (f.regiao?.length) parts.push(`Região: ${f.regiao.join(", ")}`);
  return parts.length ? parts.join(" | ") : "Sem filtros.";
};

const stamp = () => {
  const d = new Date();
  const pad = (n:number)=>String(n).padStart(2,"0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}`;
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
export function exportCSV(rows: Oil[], filename = `oleos_export_${stamp()}.csv`) {
  const headers = [
    "id","nome_pt","nome_latim","tipo_produto","categoria","familia_botanica","familia_olfativa",
    "parte_usada","metodo_extracao","principais_constituintes","efeitos_esperados",
    "aplicacoes_sugeridas","veiculos_recomendados","diluicoes","precaucoes","contraindicacoes",
    "notas_rapidas_seguranca","uso_pele_sensivel","uso_ambiente_clinico","fototoxico","sensibilizante",
    "publicos_restritos","regiao_origem","fontes"
  ];
  const esc = (s?: string | null) => {
    const v = (s ?? "").replace(/\r?\n/g," ").replace(/"/g,'""');
    return `"${v}"`;
  };
  const line = (r: Oil) => [
    r.id, r.nome_pt, r.nome_latim, r.tipo_produto, r.categoria, r.familia_botanica,
    r.familia_olfativa_raw || r.familia_olfativa || "",
    r.parte_usada, r.metodo_extracao_raw || r.metodo_extracao || "",
    fmtConstituintes(r.principais_constituintes),
    join(r.efeitos_esperados), join(r.aplicacoes_sugeridas), join(r.veiculos_recomendados),
    r.diluicoes?.geral || "",
    r.precaucoes || "", r.contraindicacoes || "", r.notas_rapidas_seguranca || "",
    String(r.uso_pele_sensivel ?? ""), String(r.uso_ambiente_clinico ?? ""),
    String(r.fototoxico ?? ""), String(r.sensibilizante ?? ""),
    JSON.stringify(r.publicos_restritos || {}),
    r.regiao_origem || "",
    (r.fontes || []).map(f => f.url || f.ref || "").filter(Boolean).join("; ")
  ].map(v => esc(String(v)));
  const csv = [headers.map(esc).join(","), ...rows.map(r => line(r).join(","))].join("\n");
  downloadBlob(csv, filename, "text/csv;charset=utf-8");
}

// ---------- TXT ----------
export function exportTXT(rows: Oil[], f?: Filters, filename = `oleos_export_${stamp()}.txt`) {
  const header = `Relatório — Óleos essenciais\nGerado em: ${new Date().toLocaleString()}\nResultados: ${rows.length}\nFiltros: ${filterSummary(f)}\n\n`;
  const body = rows.map((r, i) => {
    const fontes = (r.fontes || []).map(f => f.url || f.ref).filter(Boolean).join("; ");
    return [
      `#${i+1} — ${r.nome_pt}${r.nome_latim ? ` (${r.nome_latim})` : ""}`,
      `Tipo: ${r.tipo_produto || "—"} | Categoria: ${r.categoria || "—"}`,
      `Família botânica: ${r.familia_botanica || "—"} | Família olfativa: ${r.familia_olfativa_raw || r.familia_olfativa || "—"}`,
      `Parte usada: ${r.parte_usada || "—"} | Método: ${r.metodo_extracao_raw || r.metodo_extracao || "—"}`,
      `Constituintes: ${fmtConstituintes(r.principais_constituintes) || "—"}`,
      `Efeitos: ${join(r.efeitos_esperados) || "—"}`,
      `Aplicações: ${join(r.aplicacoes_sugeridas) || "—"}`,
      `Veículos: ${join(r.veiculos_recomendados) || "—"}`,
      `Diluições: ${r.diluicoes?.geral || "—"}`,
      `Precauções: ${r.precaucoes || "—"}`,
      `Contraindicações: ${r.contraindicacoes || "—"}`,
      `Notas de segurança: ${r.notas_rapidas_seguranca || "—"}`,
      `Pele sensível: ${fmtYesNo(r.uso_pele_sensivel)} | Ambiente clínico: ${fmtYesNo(r.uso_ambiente_clinico)} | Fototóxico: ${fmtYesNo(r.fototoxico)}`,
      `Públicos restritos: ${JSON.stringify(r.publicos_restritos || {})}`,
      `Região de origem: ${r.regiao_origem || "—"}`,
      `Fontes: ${fontes || "—"}`,
      ``,
    ].join("\n");
  }).join("\n");
  downloadBlob(header + body, filename, "text/plain;charset=utf-8");
}

// ---------- PDF ----------
export async function exportPDF(rows: Oil[], f?: Filters, filename = `oleos_export_${stamp()}.pdf`) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  const addHeader = () => {
    doc.setFont("helvetica","bold");
    doc.setFontSize(12);
    doc.text("Relatório — Óleos essenciais", margin, margin);
    doc.setFont("helvetica","normal");
    doc.setFontSize(9);
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, margin, margin+14);
    doc.text(`Resultados: ${rows.length}`, margin, margin+28);
    doc.setFontSize(8);
    const filters = doc.splitTextToSize(`Filtros: ${filterSummary(f)}`, pageWidth - margin*2);
    doc.text(filters, margin, margin+42);
    doc.setLineWidth(0.5);
    doc.line(margin, margin+50, pageWidth-margin, margin+50);
  };
  const addFooter = () => {
    const pageCount = doc.getNumberOfPages();
    for (let i=1; i<=pageCount; i++){
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Página ${i} / ${pageCount}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 20, { align: "right" });
    }
  };

  addHeader();

  // Tabela-resumo (nome / latim / família / método)
  autoTable(doc, {
    startY: margin+60,
    styles: { fontSize: 9, cellPadding: 4 },
    head: [[ "Nome", "Nome latino", "Família botânica", "Método" ]],
    body: rows.map(r => [
      r.nome_pt,
      r.nome_latim || "—",
      r.familia_botanica || "—",
      r.metodo_extracao_raw || r.metodo_extracao || "—",
    ]),
    theme: "striped",
    headStyles: { fillColor: [33, 150, 243], textColor: 255 },
    didDrawPage: (data) => { if (data.pageNumber > 1) addHeader(); }
  });

  // Detalhes por item (uma seção por registro)
  for (const r of rows) {
    doc.addPage();
    addHeader();
    doc.setFont("helvetica","bold");
    doc.setFontSize(12);
    doc.text(`${r.nome_pt}${r.nome_latim ? ` (${r.nome_latim})` : ""}`, margin, margin+20);
    doc.setFont("helvetica","normal");
    doc.setFontSize(9);

    const kv = (k: string, v: string) => ({ col1: k, col2: v || "—" });

    const linhas = [
      kv("Tipo de produto", r.tipo_produto || ""),
      kv("Categoria", r.categoria || ""),
      kv("Família botânica", r.familia_botanica || ""),
      kv("Família olfativa", r.familia_olfativa_raw || r.familia_olfativa || ""),
      kv("Parte usada", r.parte_usada || ""),
      kv("Método de extração", r.metodo_extracao_raw || r.metodo_extracao || ""),
      kv("Principais constituintes", fmtConstituintes(r.principais_constituintes)),
      kv("Efeitos esperados", join(r.efeitos_esperados, "; ")),
      kv("Aplicações sugeridas", join(r.aplicacoes_sugeridas, "; ")),
      kv("Veículos recomendados", join(r.veiculos_recomendados, "; ")),
      kv("Diluições", r.diluicoes?.geral || ""),
      kv("Precauções", r.precaucoes || ""),
      kv("Contraindicações", r.contraindicacoes || ""),
      kv("Notas de segurança", r.notas_rapidas_seguranca || ""),
      kv("Pele sensível", fmtYesNo(r.uso_pele_sensivel)),
      kv("Ambiente clínico", fmtYesNo(r.uso_ambiente_clinico)),
      kv("Fototóxico", fmtYesNo(r.fototoxico)),
      kv("Sensibilizante", fmtYesNo(r.sensibilizante)),
      kv("Públicos restritos", JSON.stringify(r.publicos_restritos || {})),
      kv("Região de origem", r.regiao_origem || ""),
      kv("Fontes", (r.fontes || []).map(f=>f.url || f.ref || "").filter(Boolean).join("; ")),
    ];

    autoTable(doc, {
      startY: margin+30,
      styles: { fontSize: 9, cellPadding: 4 },
      body: linhas.map(l => [l.col1, l.col2]),
      theme: "grid",
      columnStyles: { 0: { cellWidth: 180, fontStyle: "bold" }, 1: { cellWidth: pageWidth - margin*2 - 180 } },
      didDrawPage: () => { /* header already drawn */ }
    });
  }

  addFooter();
  doc.save(filename);
}