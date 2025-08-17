import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'pt-BR' | 'en-US' | 'es-ES';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  'pt-BR': {
    // Navigation
    'nav.home': 'Início',
    'nav.recipes': 'Receitas',
    'nav.essentialOils': 'Óleos Essenciais',
    'nav.instructions': 'Instruções',
    'nav.about': 'Pague-me um café',
    'nav.admin': 'Admin',
    
    // Hero Section
    'hero.title': 'VitaeCare',
    'hero.subtitle': 'Aplicação Portátil de Aromaterapia',
    'hero.description': 'Aplicativo Portátil que te permite cadastrar, organizar e pesquisar informações sobre óleos e receitas. Todas as informações são de sua responsabilidade. Distribuimos apenas um aplicativo de teste sem qualquer garantia. Use por conta e risco.',
    'hero.cta': 'Explorar Óleos Essenciais',
    'hero.safe.info': 'Informações Seguras',
    'hero.scientific.base': 'Base Científica',
    'hero.recipes.count': '500+ Receitas',
    'hero.essential.oils': 'Óleos Essenciais',
    'hero.therapeutic.recipes': 'Receitas Terapêuticas',
    'hero.hydrolats': 'Hidrolatos',
    'hero.free': 'Gratuito',
    
    // Home Page CTAs
    'home.cta.admin': 'Administrar Dados',
    'home.cta.import': 'Importar JSON',
    'home.cta.oils': 'Ver Óleos',
    'home.cta.recipes': 'Ver Receitas',
    'home.cta.start.here': 'Comece por aqui',
    
    // Home Page Steps
    'home.steps.title': 'Como Começar',
    'home.steps.step1.title': '1. Rode Local',
    'home.steps.step1.desc': 'Baixe e execute esta aplicação portátil em seu computador',
    'home.steps.step2.title': '2. Cadastre Dados',
    'home.steps.step2.desc': 'Importe ou cadastre seus próprios óleos e receitas via Admin',
    'home.steps.step3.title': '3. Explore e Exporte',
    'home.steps.step3.desc': 'Use filtros, busque informações e exporte em PDF/CSV/TXT',
    'home.steps.step4.title': '4. Valide Segurança',
    'home.steps.step4.desc': 'Sempre revise informações e referências antes de aplicar',
    
    // Home Page Status
    'home.status.title': 'Status dos Dados',
    'home.status.oils': 'Óleos',
    'home.status.recipes': 'Receitas',
    'home.status.items': 'itens',
    'home.status.missing': 'Arquivo ausente',
    
    // Disclaimer
    'disclaimer.title': 'Importante: Dados de Exemplo',
    'disclaimer.message': 'Os dados apresentados são exemplos gerados por IA e podem conter imprecisões. Cadastre/importe suas próprias informações. O autor não se responsabiliza pelo uso dos dados de exemplo.',
    'disclaimer.learn.more': 'Saiba mais',
    
    // Import Dialog
    'import.title': 'Importar Dados JSON',
    'import.oils.title': 'Óleos Essenciais',
    'import.recipes.title': 'Receitas',
    'import.oils.desc': 'Substitua o arquivo oils_catalog.json em /public/data/',
    'import.recipes.desc': 'Substitua o arquivo recipes_catalog.json em /public/data/',
    'import.instruction': 'Sem backend: Substitua manualmente os arquivos e recarregue a página.',
    'import.choose.file': 'Escolher Arquivo',
    'import.import': 'Importar',
    
    // Featured Content
    'featured.title': 'Recursos em Destaque',
    'featured.recipes.title': 'Receitas Terapêuticas',
    'featured.recipes.description': 'Fórmulas práticas para bem-estar, com dosagens e aplicações detalhadas',
    'featured.oils.title': 'Fichas Técnicas',
    'featured.oils.description': 'Propriedades, contraindicações e usos seguros de cada óleo essencial',
    'featured.safety.title': 'Guias de Segurança',
    'featured.safety.description': 'Protocolos e precauções para aplicação responsável da aromaterapia',
    'featured.popular': 'Receitas Populares',
    'featured.oils.featured': 'Óleos em Destaque',
    'featured.viewAll': 'Ver Todas',
    'featured.viewAll.oils': 'Ver Todos',
    'featured.ingredients': 'ingredientes',
    'featured.safety.label': 'Segurança',
    'featured.daily.recipe': 'Receita do Dia',
    'featured.daily.recipe.desc': 'Descobra uma nova fórmula terapêutica todos os dias',
    'featured.daily.oil': 'Óleo do Dia',
    'featured.daily.oil.desc': 'Aprenda sobre um óleo essencial específico diariamente',
    'featured.news': 'Novidades',
    'featured.news.desc': 'Últimas pesquisas e atualizações científicas',
    'featured.view': 'Visualizar',
    'featured.explore': 'Explorar',
    'featured.check': 'Conferir',
    
    // Essential Oils Page
    'oils.title': 'Óleos Essenciais & Hidrolatos',
    'oils.subtitle': 'Fichas técnicas completas com informações científicas, tradição herbórea, segurança e aplicações terapêuticas.',
    'oils.search.placeholder': 'Buscar por nome, constituintes, efeitos...',
    'oils.filters.category': 'Categoria',
    'oils.filters.family': 'Família Botânica',
    'oils.filters.safety': 'Segurança',
    'oils.filters.all.categories': 'Todas as categorias',
    'oils.filters.all.families': 'Todas as famílias',
    'oils.filters.all.safety': 'Todos os tipos',
    'oils.filters.sensitive.skin': 'Seguro p/ pele sensível',
    'oils.filters.clinical.use': 'Uso clínico',
    'oils.sort.by': 'Ordenar por',
    'oils.sort.name': 'Nome',
    'oils.sort.category': 'Categoria',
    'oils.sort.family': 'Família',
    'oils.export.results': 'Exportar Resultados',
    'oils.results': 'Resultados',
    'oils.active.filters': 'Filtros ativos',
    'oils.no.results': 'Nenhum resultado encontrado',
    'oils.try.different': 'Tente ajustar os filtros para encontrar mais resultados.',
    'oils.view.details': 'Ver Detalhes',
    'oils.part.used': 'Parte Usada',
    'oils.extraction': 'Extração',
    'oils.botanical.family': 'Família Botânica',
    'oils.olfactory.family': 'Família Olfativa',
    'oils.main.constituents': 'Principais Constituintes',
    'oils.expected.effects': 'Efeitos Esperados',
    'oils.suggested.applications': 'Aplicações Sugeridas',
    'oils.safety.indicators': 'Indicadores de Segurança',
    'oils.sensitive.skin': 'Pele Sensível',
    'oils.clinical.environment': 'Ambiente Clínico',
    'oils.scalp.use': 'Uso no Couro Cabeludo',
    'oils.safe': 'Seguro',
    'oils.recommended': 'Recomendado',
    'oils.cautious': 'Cauteloso',
    'oils.not.recommended': 'Não Recomendado',
    'oils.very.safe': 'Muito Seguro',
    'oils.details.overview': 'Visão Geral',
    'oils.details.effects': 'Efeitos e Aplicações',
    'oils.details.constituents': 'Constituintes e Tradição',
    'oils.details.safety': 'Segurança',
    'oils.details.synergies': 'Sinergias e Incompatibilidades',
    'oils.details.sources': 'Fontes',
    'oils.traditional.properties': 'Propriedades Tradicionais',
    'oils.ethnobotany': 'Etnobotânica',
    'oils.precautions': 'Precauções',
    'oils.contraindications': 'Contraindicações',
    'oils.dilution.notes': 'Observações de Diluição',
    'oils.recommended.vehicles': 'Veículos Recomendados',
    'oils.suggested.synergies': 'Sinergias Sugeridas',
    'oils.practical.incompatibilities': 'Incompatibilidades Práticas',
    'oils.none.known': 'Nenhuma conhecida',
    
    // About Page
    'about.title': 'Sobre o AromaGuia',
    'about.mission.title': 'Nossa Missão',
    'about.mission.description': 'Democratizar o acesso à aromaterapia baseada em evidências, oferecendo informações confiáveis, seguras e práticas para profissionais e entusiastas.',
    
    // Common
    'common.loading': 'Carregando...',
    'common.error': 'Erro',
    'common.close': 'Fechar',
    'common.save': 'Salvar',
    'common.cancel': 'Cancelar',
    
    // 404 Page
    '404.title': '404',
    '404.message': 'Oops! Página não encontrada',
    '404.home': 'Voltar ao Início',

    // Donation
    'donation.title': 'Pague-me um café',
    'donation.subtitle': 'Se este projeto te ajuda, considere apoiar — isso mantém tudo vivo e evoluindo.',
    'donation.copied': 'Copiado!',
    'donation.copy': 'Copiar',
    'donation.copiedToClipboard': 'copiado para a área de transferência.',
    'donation.copyError': 'Não foi possível copiar',
    'donation.copyErrorDesc': 'Tente novamente ou copie manualmente.',
    'donation.authorMessage.title': 'Por que apoiar este projeto?',
    'donation.authorMessage.timeInvested': 'Foram muitas horas de desenvolvimento para criar esta aplicação web funcional, responsiva e portátil.',
    'donation.authorMessage.investment': 'Seu apoio reconhece o esforço investido na criação desta ferramenta completa.',
    'donation.authorMessage.openSource': 'O código é aberto e feito com carinho para a comunidade aromaterápica.',
    'donation.authorMessage.futureIdeas': 'Este projeto está finalizado e pronto para uso offline como aplicação portátil.',
    'donation.authorMessage.encouragement': 'Se esta ferramenta te ajuda, um café é uma forma de valorizar o trabalho realizado. Obrigado!',
    'donation.brazil.title': 'Brasil',
    'donation.international.title': 'Internacional',
    'donation.crypto.title': 'Criptomoedas',
    'donation.training.title': 'Treinamentos e parcerias',
    'donation.training.description': 'Precisa de ajuda com automações, AI e fluxo de trabalho? Vamos conversar!',
    'donation.contact.title': 'Conectar',
    'donation.contact.description': 'Fique à vontade para me chamar nas redes para ideias, dúvidas e colaborações.',
  },
  
  'en-US': {
    // Navigation
    'nav.home': 'Home',
    'nav.recipes': 'Recipes',
    'nav.essentialOils': 'Essential Oils',
    'nav.instructions': 'Instructions',
    'nav.about': 'Buy me a coffee',
    'nav.admin': 'Admin',
    
    // Hero Section
    'hero.title': 'VitaeCare',
    'hero.subtitle': 'Portable Aromatherapy Application',
    'hero.description': 'Portable application that allows you to register, organize and search information about oils and recipes. All information is your responsibility. We only distribute a test application without any warranty. Use at your own risk.',
    'hero.cta': 'Explore Essential Oils',
    'hero.safe.info': 'Safe Information',
    'hero.scientific.base': 'Scientific Base',
    'hero.recipes.count': '500+ Recipes',
    'hero.essential.oils': 'Essential Oils',
    'hero.therapeutic.recipes': 'Therapeutic Recipes',
    'hero.hydrolats': 'Hydrolats',
    'hero.free': 'Free',
    
    // Home Page CTAs
    'home.cta.admin': 'Manage Data',
    'home.cta.import': 'Import JSON',
    'home.cta.oils': 'View Oils',
    'home.cta.recipes': 'View Recipes',
    'home.cta.start.here': 'Start here',
    
    // Home Page Steps
    'home.steps.title': 'Getting Started',
    'home.steps.step1.title': '1. Run Locally',
    'home.steps.step1.desc': 'Download and run this portable application on your computer',
    'home.steps.step2.title': '2. Register Data',
    'home.steps.step2.desc': 'Import or register your own oils and recipes via Admin',
    'home.steps.step3.title': '3. Explore & Export',
    'home.steps.step3.desc': 'Use filters, search information and export to PDF/CSV/TXT',
    'home.steps.step4.title': '4. Validate Safety',
    'home.steps.step4.desc': 'Always review information and references before applying',
    
    // Home Page Status
    'home.status.title': 'Data Status',
    'home.status.oils': 'Oils',
    'home.status.recipes': 'Recipes',
    'home.status.items': 'items',
    'home.status.missing': 'File missing',
    
    // Disclaimer
    'disclaimer.title': 'Important: Example Data',
    'disclaimer.message': 'The displayed data are AI-generated examples and may contain inaccuracies. Register/import your own information. The author is not responsible for the use of example data.',
    'disclaimer.learn.more': 'Learn more',
    
    // Import Dialog
    'import.title': 'Import JSON Data',
    'import.oils.title': 'Essential Oils',
    'import.recipes.title': 'Recipes',
    'import.oils.desc': 'Replace the oils_catalog.json file in /public/data/',
    'import.recipes.desc': 'Replace the recipes_catalog.json file in /public/data/',
    'import.instruction': 'No backend: Manually replace files and reload the page.',
    'import.choose.file': 'Choose File',
    'import.import': 'Import',
    
    // Featured Content
    'featured.title': 'Featured Resources',
    'featured.recipes.title': 'Therapeutic Recipes',
    'featured.recipes.description': 'Practical formulas for wellness, with detailed dosages and applications',
    'featured.oils.title': 'Technical Datasheets',
    'featured.oils.description': 'Properties, contraindications and safe uses of each essential oil',
    'featured.safety.title': 'Safety Guides',
    'featured.safety.description': 'Protocols and precautions for responsible aromatherapy application',
    'featured.popular': 'Popular Recipes',
    'featured.oils.featured': 'Featured Oils',
    'featured.viewAll': 'View All',
    'featured.viewAll.oils': 'View All',
    'featured.ingredients': 'ingredients',
    'featured.safety.label': 'Safety',
    'featured.daily.recipe': 'Recipe of the Day',
    'featured.daily.recipe.desc': 'Discover a new therapeutic formula every day',
    'featured.daily.oil': 'Oil of the Day',
    'featured.daily.oil.desc': 'Learn about a specific essential oil daily',
    'featured.news': 'News',
    'featured.news.desc': 'Latest research and scientific updates',
    'featured.view': 'View',
    'featured.explore': 'Explore',
    'featured.check': 'Check',
    
    // Essential Oils Page
    'oils.title': 'Essential Oils & Hydrolats',
    'oils.subtitle': 'Complete technical datasheets with scientific information, herbal tradition, safety and therapeutic applications.',
    'oils.search.placeholder': 'Search by name, constituents, effects...',
    'oils.filters.category': 'Category',
    'oils.filters.family': 'Botanical Family',
    'oils.filters.safety': 'Safety',
    'oils.filters.all.categories': 'All categories',
    'oils.filters.all.families': 'All families',
    'oils.filters.all.safety': 'All types',
    'oils.filters.sensitive.skin': 'Safe for sensitive skin',
    'oils.filters.clinical.use': 'Clinical use',
    'oils.sort.by': 'Sort by',
    'oils.sort.name': 'Name',
    'oils.sort.category': 'Category',
    'oils.sort.family': 'Family',
    'oils.export.results': 'Export Results',
    'oils.results': 'Results',
    'oils.active.filters': 'Active filters',
    'oils.no.results': 'No results found',
    'oils.try.different': 'Try adjusting the filters to find more results.',
    'oils.view.details': 'View Details',
    'oils.part.used': 'Part Used',
    'oils.extraction': 'Extraction',
    'oils.botanical.family': 'Botanical Family',
    'oils.olfactory.family': 'Olfactory Family',
    'oils.main.constituents': 'Main Constituents',
    'oils.expected.effects': 'Expected Effects',
    'oils.suggested.applications': 'Suggested Applications',
    'oils.safety.indicators': 'Safety Indicators',
    'oils.sensitive.skin': 'Sensitive Skin',
    'oils.clinical.environment': 'Clinical Environment',
    'oils.scalp.use': 'Scalp Use',
    'oils.safe': 'Safe',
    'oils.recommended': 'Recommended',
    'oils.cautious': 'Cautious',
    'oils.not.recommended': 'Not Recommended',
    'oils.very.safe': 'Very Safe',
    'oils.details.overview': 'Overview',
    'oils.details.effects': 'Effects and Applications',
    'oils.details.constituents': 'Constituents and Tradition',
    'oils.details.safety': 'Safety',
    'oils.details.synergies': 'Synergies and Incompatibilities',
    'oils.details.sources': 'Sources',
    'oils.traditional.properties': 'Traditional Properties',
    'oils.ethnobotany': 'Ethnobotany',
    'oils.precautions': 'Precautions',
    'oils.contraindications': 'Contraindications',
    'oils.dilution.notes': 'Dilution Notes',
    'oils.recommended.vehicles': 'Recommended Vehicles',
    'oils.suggested.synergies': 'Suggested Synergies',
    'oils.practical.incompatibilities': 'Practical Incompatibilities',
    'oils.none.known': 'None known',
    
    // About Page
    'about.title': 'About AromaGuide',
    'about.mission.title': 'Our Mission',
    'about.mission.description': 'Democratize access to evidence-based aromatherapy, offering reliable, safe and practical information for professionals and enthusiasts.',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.close': 'Close',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    
    // 404 Page
    '404.title': '404',
    '404.message': 'Oops! Page not found',
    '404.home': 'Return to Home',

    // Donation
    'donation.title': 'Buy me a coffee',
    'donation.subtitle': 'If this project helps you, consider supporting it — it keeps everything alive and improving.',
    'donation.copied': 'Copied!',
    'donation.copy': 'Copy',
    'donation.copiedToClipboard': 'copied to clipboard.',
    'donation.copyError': "Couldn't copy",
    'donation.copyErrorDesc': 'Please try again or copy manually.',
    'donation.authorMessage.title': 'Why support this project?',
    'donation.authorMessage.timeInvested': 'Many hours of development to create this functional, responsive and portable web application.',
    'donation.authorMessage.investment': 'Your support recognizes the effort invested in creating this complete tool.',
    'donation.authorMessage.openSource': 'The code is open and crafted with care for the aromatherapy community.',
    'donation.authorMessage.futureIdeas': 'This project is complete and ready for offline use as a portable application.',
    'donation.authorMessage.encouragement': 'If this tool helps you, a coffee is a way to value the work done. Thank you!',
    'donation.brazil.title': 'Brazil',
    'donation.international.title': 'International',
    'donation.crypto.title': 'Crypto',
    'donation.training.title': 'Training & partnerships',
    'donation.training.description': 'Need help with automations, AI and workflows? Let\'s talk!',
    'donation.contact.title': 'Connect',
    'donation.contact.description': 'Ping me on these networks for ideas, questions and collabs.',
  },
  
  'es-ES': {
    // Navigation
    'nav.home': 'Inicio',
    'nav.recipes': 'Recetas',
    'nav.essentialOils': 'Aceites Esenciales',
    'nav.instructions': 'Instrucciones',
    'nav.about': 'Invítame un café',
    'nav.admin': 'Admin',
    
    // Hero Section
    'hero.title': 'VitaeCare',
    'hero.subtitle': 'Aplicación Portátil de Aromaterapia',
    'hero.description': 'Aplicación portátil que te permite registrar, organizar y buscar información sobre aceites y recetas. Toda la información es tu responsabilidad. Solo distribuimos una aplicación de prueba sin ninguna garantía. Usa bajo tu propio riesgo.',
    'hero.cta': 'Explorar Aceites Esenciales',
    'hero.safe.info': 'Información Segura',
    'hero.scientific.base': 'Base Científica',
    'hero.recipes.count': '500+ Recetas',
    'hero.essential.oils': 'Aceites Esenciales',
    'hero.therapeutic.recipes': 'Recetas Terapéuticas',
    'hero.hydrolats': 'Hidrolatos',
    'hero.free': 'Gratis',
    
    // Home Page CTAs
    'home.cta.admin': 'Administrar Datos',
    'home.cta.import': 'Importar JSON',
    'home.cta.oils': 'Ver Aceites',
    'home.cta.recipes': 'Ver Recetas',
    'home.cta.start.here': 'Empieza aquí',
    
    // Home Page Steps
    'home.steps.title': 'Cómo Empezar',
    'home.steps.step1.title': '1. Ejecutar Local',
    'home.steps.step1.desc': 'Descarga y ejecuta esta aplicación portátil en tu computadora',
    'home.steps.step2.title': '2. Registrar Datos',
    'home.steps.step2.desc': 'Importa o registra tus propios aceites y recetas vía Admin',
    'home.steps.step3.title': '3. Explorar y Exportar',
    'home.steps.step3.desc': 'Usa filtros, busca información y exporta a PDF/CSV/TXT',
    'home.steps.step4.title': '4. Validar Seguridad',
    'home.steps.step4.desc': 'Siempre revisa información y referencias antes de aplicar',
    
    // Home Page Status
    'home.status.title': 'Estado de los Datos',
    'home.status.oils': 'Aceites',
    'home.status.recipes': 'Recetas',
    'home.status.items': 'elementos',
    'home.status.missing': 'Archivo faltante',
    
    // Disclaimer
    'disclaimer.title': 'Importante: Datos de Ejemplo',
    'disclaimer.message': 'Los datos mostrados son ejemplos generados por IA y pueden contener imprecisiones. Registra/importa tu propia información. El autor no se responsabiliza por el uso de los datos de ejemplo.',
    'disclaimer.learn.more': 'Saber más',
    
    // Import Dialog
    'import.title': 'Importar Datos JSON',
    'import.oils.title': 'Aceites Esenciales',
    'import.recipes.title': 'Recetas',
    'import.oils.desc': 'Reemplaza el archivo oils_catalog.json en /public/data/',
    'import.recipes.desc': 'Reemplaza el archivo recipes_catalog.json en /public/data/',
    'import.instruction': 'Sin backend: Reemplaza manualmente los archivos y recarga la página.',
    'import.choose.file': 'Elegir Archivo',
    'import.import': 'Importar',
    
    // Featured Content
    'featured.title': 'Recursos Destacados',
    'featured.recipes.title': 'Recetas Terapéuticas',
    'featured.recipes.description': 'Fórmulas prácticas para bienestar, con dosis y aplicaciones detalladas',
    'featured.oils.title': 'Fichas Técnicas',
    'featured.oils.description': 'Propiedades, contraindicaciones y usos seguros de cada aceite esencial',
    'featured.safety.title': 'Guías de Seguridad',
    'featured.safety.description': 'Protocolos y precauciones para aplicación responsable de aromaterapia',
    'featured.popular': 'Recetas Populares',
    'featured.oils.featured': 'Aceites Destacados',
    'featured.viewAll': 'Ver Todas',
    'featured.viewAll.oils': 'Ver Todos',
    'featured.ingredients': 'ingredientes',
    'featured.safety.label': 'Seguridad',
    'featured.daily.recipe': 'Receta del Día',
    'featured.daily.recipe.desc': 'Descubre una nueva fórmula terapéutica todos los días',
    'featured.daily.oil': 'Aceite del Día',
    'featured.daily.oil.desc': 'Aprende sobre un aceite esencial específico diariamente',
    'featured.news': 'Novedades',
    'featured.news.desc': 'Últimas investigaciones y actualizaciones científicas',
    'featured.view': 'Ver',
    'featured.explore': 'Explorar',
    'featured.check': 'Comprobar',
    
    // Essential Oils Page
    'oils.title': 'Aceites Esenciales e Hidrolatos',
    'oils.subtitle': 'Fichas técnicas completas con información científica, tradición herbórea, seguridad y aplicaciones terapéuticas.',
    'oils.search.placeholder': 'Buscar por nombre, constituyentes, efectos...',
    'oils.filters.category': 'Categoría',
    'oils.filters.family': 'Familia Botánica',
    'oils.filters.safety': 'Seguridad',
    'oils.filters.all.categories': 'Todas las categorías',
    'oils.filters.all.families': 'Todas las familias',
    'oils.filters.all.safety': 'Todos los tipos',
    'oils.filters.sensitive.skin': 'Seguro p/ piel sensible',
    'oils.filters.clinical.use': 'Uso clínico',
    'oils.sort.by': 'Ordenar por',
    'oils.sort.name': 'Nombre',
    'oils.sort.category': 'Categoría',
    'oils.sort.family': 'Familia',
    'oils.export.results': 'Exportar Resultados',
    'oils.results': 'Resultados',
    'oils.active.filters': 'Filtros activos',
    'oils.no.results': 'No se encontraron resultados',
    'oils.try.different': 'Intenta ajustar los filtros para encontrar más resultados.',
    'oils.view.details': 'Ver Detalles',
    'oils.part.used': 'Parte Usada',
    'oils.extraction': 'Extracción',
    'oils.botanical.family': 'Familia Botánica',
    'oils.olfactory.family': 'Familia Olfativa',
    'oils.main.constituents': 'Principales Constituyentes',
    'oils.expected.effects': 'Efectos Esperados',
    'oils.suggested.applications': 'Aplicaciones Sugeridas',
    'oils.safety.indicators': 'Indicadores de Seguridad',
    'oils.sensitive.skin': 'Piel Sensible',
    'oils.clinical.environment': 'Ambiente Clínico',
    'oils.scalp.use': 'Uso en Cuero Cabelludo',
    'oils.safe': 'Seguro',
    'oils.recommended': 'Recomendado',
    'oils.cautious': 'Cauteloso',
    'oils.not.recommended': 'No Recomendado',
    'oils.very.safe': 'Muy Seguro',
    'oils.details.overview': 'Resumen',
    'oils.details.effects': 'Efectos y Aplicaciones',
    'oils.details.constituents': 'Constituyentes y Tradición',
    'oils.details.safety': 'Seguridad',
    'oils.details.synergies': 'Sinergias e Incompatibilidades',
    'oils.details.sources': 'Fuentes',
    'oils.traditional.properties': 'Propiedades Tradicionales',
    'oils.ethnobotany': 'Etnobotánica',
    'oils.precautions': 'Precauciones',
    'oils.contraindications': 'Contraindicaciones',
    'oils.dilution.notes': 'Observaciones de Dilución',
    'oils.recommended.vehicles': 'Vehículos Recomendados',
    'oils.suggested.synergies': 'Sinergias Sugeridas',
    'oils.practical.incompatibilities': 'Incompatibilidades Prácticas',
    'oils.none.known': 'Ninguna conocida',
    
    // About Page
    'about.title': 'Acerca de AromaGuía',
    'about.mission.title': 'Nuestra Misión',
    'about.mission.description': 'Democratizar el acceso a aromaterapia basada en evidencia, ofreciendo información confiable, segura y práctica para profesionales y entusiastas.',
    
    // Common
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.close': 'Cerrar',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    
    // 404 Page
    '404.title': '404',
    '404.message': '¡Oops! Página no encontrada',
    '404.home': 'Volver al Inicio',

    // Donation
    'donation.title': 'Invítame un café',
    'donation.subtitle': 'Si este proyecto te ayuda, considera apoyarlo: así seguimos vivos y mejorando.',
    'donation.copied': '¡Copiado!',
    'donation.copy': 'Copiar',
    'donation.copiedToClipboard': 'copiado al portapapeles.',
    'donation.copyError': 'No se pudo copiar',
    'donation.copyErrorDesc': 'Inténtalo de nuevo o copia manualmente.',
    'donation.authorMessage.title': '¿Por qué apoyar este proyecto?',
    'donation.authorMessage.timeInvested': 'Muchas horas de desarrollo para crear esta aplicación web funcional, responsiva y portátil.',
    'donation.authorMessage.investment': 'Tu apoyo reconoce el esfuerzo invertido en crear esta herramienta completa.',
    'donation.authorMessage.openSource': 'El código es abierto y hecho con cariño para la comunidad aromaterapéutica.',
    'donation.authorMessage.futureIdeas': 'Este proyecto está finalizado y listo para uso offline como aplicación portátil.',
    'donation.authorMessage.encouragement': 'Si esta herramienta te ayuda, un café es una forma de valorar el trabajo realizado. ¡Gracias!',
    'donation.brazil.title': 'Brasil',
    'donation.international.title': 'Internacional',
    'donation.crypto.title': 'Cripto',
    'donation.training.title': 'Capacitaciones y alianzas',
    'donation.training.description': '¿Necesitas ayuda con automatizaciones, IA y flujos? ¡Conversemos!',
    'donation.contact.title': 'Conectar',
    'donation.contact.description': 'Escríbeme en estas redes para ideas, dudas y colaboraciones.',
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('aromaGuia-language');
    return (saved as Language) || 'pt-BR';
  });

  useEffect(() => {
    localStorage.setItem('aromaGuia-language', language);
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};