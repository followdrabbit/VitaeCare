# VitaeCare

> ⚠️ **Aviso Importante / Termo de Responsabilidade**
> Este aplicativo é **gratuito**, **experimental**, **sem garantias** e **sem suporte**.
> **Todo o uso, bem como as informações inseridas, interpretadas ou compartilhadas, são de responsabilidade exclusiva do usuário.**
> O sistema **não** substitui orientação de profissionais de saúde e **não** fornece conteúdo validado clinicamente.
> **Os dados carregados por padrão são fictícios**, servindo apenas para **testar e demonstrar funcionalidades**.

Aplicativo **desktop portátil (Windows)** para organização de **óleos essenciais** e **receitas**. Funciona localmente (inclusive em pendrive), com interface PT/EN/ES, filtros avançados e importação/exportação em JSON.

---

## 🚀 Executar sem build (versão portátil incluída)

O repositório inclui a última versão portátil já empacotada em **`app/`**.

1. Baixe/clonE o repositório e **abra a pasta `app/`**.
2. **Execute o arquivo `.exe`** dentro de `app/`.
3. Se o Windows exibir o SmartScreen: clique em **“Mais informações” → “Executar assim mesmo”**.
4. Para **usar em pendrive**, copie a pasta `app/` inteira para o dispositivo e rode o `.exe`.

### Onde ficam os dados no modo portátil?

* Por padrão, o app cria/usa uma pasta **`data/`** ao lado do executável **(dentro de `app/`)**.
* **Importar** substitui os dados atuais; **Exportar** cria arquivos `.json` no local que você escolher.

> Dica: para **atualizar** a versão portátil no futuro, substitua o conteúdo da pasta `app/` pela nova build.
> Se quiser **preservar seus dados**, **faça backup** da subpasta `app/data/` antes da troca.

---

## ✨ Funcionalidades principais

* **Página inicial** com navegação e destaques.
* **Óleos**: busca com debounce; filtros por intenções (relaxamento, sono, respiratório etc.), segurança (pele sensível, não fototóxico), públicos (gravidez, pediátrico, epilepsia, asma), taxonomias, parte usada, método de extração, veículos, região e ordenação; modal de detalhes.
* **Receitas**: busca e filtros por aplicação, dificuldade, tags, ingredientes, intenções, regras de segurança por menções, tempo de preparo, diluição, metadados (contraindicações/referências) e ordenação.
* **Catálogo (gerenciador)**: administrar **óleos e receitas** em uma única página (CRUD), com importação/exportação, confirmação de saída e filtros espelhados.
* **Instruções**: como usar, responsabilidade do usuário, portabilidade e local dos dados.
* **Doações** e redirecionamento **/sobre → /pague-me-um-cafe**.
* **404** com i18n.

**Rotas:** `/` (Início), `/oleos`, `/receitas`, `/catalogo`, `/instrucoes`, `/pague-me-um-cafe`, `/sobre` (redirect), e 404.

---

## 🧭 Fluxo de dados

* **Dados fictícios por padrão** — apenas para validar funcionalidades.
* **Importar/Exportar** `.json` nas telas de Óleos/Receitas/Catálogo.
* No **modo portátil**, os dados residem em `app/data/` (ao lado do `.exe`).
* **Você** é responsável por manter backup dos seus arquivos.

---

## 🔧 Stack

* **Vite + React + TypeScript** (react-router-dom, shadcn/ui, Radix UI, Tailwind, lucide-react).
* **Tauri v2 (Windows)** para empacote portátil e diálogos nativos de arquivo.

---

## ▶️ Desenvolvimento (web)

```bash
npm install
npm run dev
```

Acesse a porta indicada no terminal (ex.: `http://localhost:3000`).

---

## 💻 Como gerar o **portable** (Windows)

> Para colaboradores/usuários que **precisam reconstruir** o executável a partir do código.

### 0) Pré-requisitos (uma vez por máquina)

Abra **PowerShell como Administrador**:

```powershell
winget install --id Rustlang.Rustup -e
rustup default stable
rustup update

winget install --id Microsoft.VisualStudio.2022.BuildTools -e  # marque "Desktop development with C++" + Windows 10/11 SDK
winget install --id Microsoft.EdgeWebView2Runtime -e           # WebView2 Runtime

# (opcional) diretório curto para build nativo
setx CARGO_TARGET_DIR C:\cargo-target
```

> Reabra o terminal após instalar os Build Tools.

### 1) Clonar e instalar dependências

```powershell
git clone <URL_DO_REPO> VitaeCare
cd VitaeCare
npm install
```

### 2) Garantir componentes Tauri usados no projeto

```powershell
npm i -D @tauri-apps/cli@2.7.1
npm i @tauri-apps/api@^2 @tauri-apps/plugin-dialog@^2
```

### 3) Build portátil

```powershell
# (opcional, apenas nesta sessão)
set CARGO_TARGET_DIR=C:\cargo-target

npm run build:portable
```

**Saída**

* Sem `CARGO_TARGET_DIR`: `src-tauri\target\release\bundle\`
* Com `CARGO_TARGET_DIR`: `C:\cargo-target\release\bundle\`
  Copie o artefato gerado para a pasta `app/` (se quiser manter o repositório com a versão embutida).

---

## 🧪 Testes rápidos

* Use **Importar** para carregar seu `.json` (os de exemplo são fictícios).
* Use **Exportar** para gerar backup.
* Confira se a pasta `data/` foi criada ao lado do `.exe` (modo portátil).

---

## 📦 Estrutura (resumo)

```
app/                # ← versão portátil inclusa (executável + arquivos de runtime)
  VitaeCare.exe     # nome ilustrativo — execute este arquivo
  data/             # dados locais do usuário (criada/atualizada em runtime)
src/                # código-fonte React/TS
src/pages/          # páginas (Oleos, Receitas, Catalogo, Instrucoes, etc.)
src/services/       # integração (import/export, etc.)
src-tauri/          # projeto Tauri (Rust, config, bundle)
```

> **Observação**: manter binários grandes versionados em Git pode inflar o repositório. Se preferir, publique o conteúdo de `app/` em **Releases** (ZIP) e mantenha no repo apenas o código-fonte.

---

## ❗ Responsabilidade de uso (reforço)

* Projeto **gratuito**, **sem suporte** e **sem garantias**.
* **Você** é o único responsável por quaisquer dados inseridos e por como interpreta/usa as informações exibidas.
* O app **não** substitui orientação de profissionais de saúde.
* **Dados padrão são fictícios** e servem **exclusivamente** para testes.

---

## 🤝 Contribuições

PRs são bem-vindos (UX, acessibilidade, filtros, i18n).
Antes de abrir PR, confirme o build local (web e portátil) e siga o padrão de código.

---

## 📜 Licença

Adicione um arquivo `LICENSE` ao repositório especificando a licença de sua preferência.
