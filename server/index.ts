import express from 'express';
import cors from 'cors';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { OilSchema, RecipesRootSchema } from '../src/lib/schemas.js';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Auth middleware
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = req.headers['x-admin-token'] as string;
  const expectedToken = process.env.ADMIN_WRITE_TOKEN;
  
  // Em desenvolvimento, permitir sem token
  if (process.env.NODE_ENV !== 'production' && !expectedToken) {
    return next();
  }
  
  if (!expectedToken) {
    return res.status(401).json({ error: 'Token de administração não configurado' });
  }
  
  if (token !== expectedToken) {
    return res.status(401).json({ error: 'Token inválido' });
  }
  
  next();
};

// Helper para ler arquivo oficial
async function readDataFile(filePath: string) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    throw new Error(`Arquivo não encontrado: ${filePath}`);
  }
}

// Helper para escrever arquivo
async function writeDataFile(filePath: string, data: any) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Rotas para óleos
app.get('/api/data/oils', async (req, res) => {
  try {
    const filePath = path.join(__dirname, '../public/data/oils_catalog.json');
    
    const data = await readDataFile(filePath);
    res.json(data);
  } catch (error) {
    console.error('Erro ao ler óleos:', error);
    res.status(404).json({ error: 'Arquivo de óleos não encontrado' });
  }
});

app.put('/api/data/oils', requireAuth, async (req, res) => {
  try {
    const oils = z.array(OilSchema).parse(req.body);
    const filePath = path.join(__dirname, '../public/data/oils_catalog.json');
    
    await writeDataFile(filePath, oils);
    res.json({ success: true, count: oils.length });
  } catch (error) {
    console.error('Erro ao salvar óleos:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    } else {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
});

// Rotas para receitas
app.get('/api/data/recipes', async (req, res) => {
  try {
    const filePath = path.join(__dirname, '../public/data/recipes_catalog.json');
    
    const data = await readDataFile(filePath);
    res.json(data);
  } catch (error) {
    console.error('Erro ao ler receitas:', error);
    res.status(404).json({ error: 'Arquivo de receitas não encontrado' });
  }
});

app.put('/api/data/recipes', requireAuth, async (req, res) => {
  try {
    const recipesRoot = RecipesRootSchema.parse(req.body);
    
    // Atualizar updated_at automaticamente
    recipesRoot.updated_at = new Date().toISOString();
    
    const filePath = path.join(__dirname, '../public/data/recipes_catalog.json');
    
    await writeDataFile(filePath, recipesRoot);
    res.json({ success: true, count: recipesRoot.recipes.length });
  } catch (error) {
    console.error('Erro ao salvar receitas:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    } else {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor API rodando na porta ${PORT}`);
});