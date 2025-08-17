import { useLanguage } from "@/contexts/LanguageContext";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Computer, AlertTriangle, Database, Upload, Download, FileText, Heart } from "lucide-react";

// Função para processar markdown simples
const parseMarkdown = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2);
      return <strong key={index}>{boldText}</strong>;
    }
    return part;
  });
};

export default function Instrucoes() {
  const { language } = useLanguage();

  const content = {
    'pt-BR': {
      title: 'Instruções',
      systemTitle: '🖥️ Sobre o sistema',
      systemDescription: 'Este é um sistema **portátil para computadores com Windows**, projetado para ser executado localmente, inclusive via **pendrive**.',
      important: '⚠️ **Importante**:',
      importantPoints: [
        'É um projeto **gratuito** e **sem suporte técnico**.',
        'Não há garantias de funcionamento ou atualizações.',
        'O uso é de **responsabilidade exclusiva do usuário**.'
      ],
      responsibilityTitle: '📢 Responsabilidade sobre as informações',
      responsibilityDescription: 'Este programa é uma **plataforma de apoio** para organização de dados sobre Aromaterapia. Ele **não fornece conteúdo verificado ou validado** por profissionais da saúde.',
      userShouldTitle: 'O usuário deve:',
      userShouldPoints: [
        'Utilizar fontes **confiáveis** ao inserir informações.',
        'Nunca substituir **orientações médicas** por dados inseridos no sistema.',
        'Assumir total responsabilidade pelo uso dos conteúdos armazenados.'
      ],
      usageTitle: '📂 Como usar o sistema',
      importTitle: '📥 Importar dados',
      importSteps: [
        'Vá até as abas **Óleos** ou **Receitas**.',
        'Clique em **Importar Arquivo**.',
        'Escolha o arquivo `.json` desejado.',
        'Os dados antigos serão **substituídos**.'
      ],
      dataLocation: '📁 Os arquivos são armazenados na pasta:',
      dataPath: '/data/',
      dataNote: 'Essa pasta será criada **no mesmo local do executável** do sistema.',
      exportTitle: '📤 Exportar dados',
      exportSteps: [
        'Clique em **Exportar** para baixar os dados atuais em formato `.json`.',
        'Use isso como backup ou para transferir para outros dispositivos.'
      ],
      finalTitle: '📝 Considerações finais',
      finalDescription: 'Este projeto foi desenvolvido para **facilitar a vida de quem usa óleos essenciais** no dia a dia. É simples, portátil e funcional.',
      finalMessage: '💙 Esperamos que o sistema ajude você. Use com responsabilidade.'
    },
    'en-US': {
      title: 'Instructions',
      systemTitle: '🖥️ About the system',
      systemDescription: 'This is a **portable system for Windows computers**, designed to run locally, including via **USB drive**.',
      important: '⚠️ **Important**:',
      importantPoints: [
        'It is a **free** project with **no technical support**.',
        'There are no guarantees of functionality or updates.',
        'Use is **user\'s sole responsibility**.'
      ],
      responsibilityTitle: '📢 Information responsibility',
      responsibilityDescription: 'This program is a **support platform** for organizing Aromatherapy data. It **does not provide verified or validated content** by health professionals.',
      userShouldTitle: 'The user should:',
      userShouldPoints: [
        'Use **reliable** sources when entering information.',
        'Never replace **medical guidance** with data entered in the system.',
        'Assume full responsibility for the use of stored content.'
      ],
      usageTitle: '📂 How to use the system',
      importTitle: '📥 Import data',
      importSteps: [
        'Go to **Oils** or **Recipes** tabs.',
        'Click **Import File**.',
        'Choose the desired `.json` file.',
        'Old data will be **replaced**.'
      ],
      dataLocation: '📁 Files are stored in the folder:',
      dataPath: '/data/',
      dataNote: 'This folder will be created **in the same location as the system executable**.',
      exportTitle: '📤 Export data',
      exportSteps: [
        'Click **Export** to download current data in `.json` format.',
        'Use this as backup or to transfer to other devices.'
      ],
      finalTitle: '📝 Final considerations',
      finalDescription: 'This project was developed to **facilitate the life of those who use essential oils** on a daily basis. It is simple, portable and functional.',
      finalMessage: '💙 We hope the system helps you. Use responsibly.'
    },
    'es-ES': {
      title: 'Instrucciones',
      systemTitle: '🖥️ Acerca del sistema',
      systemDescription: 'Este es un sistema **portátil para computadoras con Windows**, diseñado para ejecutarse localmente, incluso vía **USB**.',
      important: '⚠️ **Importante**:',
      importantPoints: [
        'Es un proyecto **gratuito** y **sin soporte técnico**.',
        'No hay garantías de funcionamiento o actualizaciones.',
        'El uso es de **responsabilidad exclusiva del usuario**.'
      ],
      responsibilityTitle: '📢 Responsabilidad sobre la información',
      responsibilityDescription: 'Este programa es una **plataforma de apoyo** para organizar datos sobre Aromaterapia. **No proporciona contenido verificado o validado** por profesionales de la salud.',
      userShouldTitle: 'El usuario debe:',
      userShouldPoints: [
        'Utilizar fuentes **confiables** al ingresar información.',
        'Nunca sustituir **orientación médica** por datos ingresados en el sistema.',
        'Asumir total responsabilidad por el uso del contenido almacenado.'
      ],
      usageTitle: '📂 Cómo usar el sistema',
      importTitle: '📥 Importar datos',
      importSteps: [
        'Ve a las pestañas **Aceites** o **Recetas**.',
        'Haz clic en **Importar Archivo**.',
        'Elige el archivo `.json` deseado.',
        'Los datos antiguos serán **reemplazados**.'
      ],
      dataLocation: '📁 Los archivos se almacenan en la carpeta:',
      dataPath: '/data/',
      dataNote: 'Esta carpeta se creará **en la misma ubicación que el ejecutable** del sistema.',
      exportTitle: '📤 Exportar datos',
      exportSteps: [
        'Haz clic en **Exportar** para descargar los datos actuales en formato `.json`.',
        'Usa esto como respaldo o para transferir a otros dispositivos.'
      ],
      finalTitle: '📝 Consideraciones finales',
      finalDescription: 'Este proyecto fue desarrollado para **facilitar la vida de quienes usan aceites esenciales** en el día a día. Es simple, portátil y funcional.',
      finalMessage: '💙 Esperamos que el sistema te ayude. Usa con responsabilidad.'
    }
  };

  const t = content[language] || content['pt-BR'];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="bg-gradient-subtle">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">{t.title}</h1>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            {/* Sobre o sistema */}
            <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50">
              <div className="flex items-start gap-4 mb-4">
                <Computer className="w-6 h-6 text-primary mt-1" />
                <h2 className="text-2xl font-semibold text-foreground">{t.systemTitle}</h2>
              </div>
              <div className="space-y-4 text-muted-foreground">
                <p className="leading-relaxed">{parseMarkdown(t.systemDescription)}</p>
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                  <p className="font-semibold text-warning mb-2">{parseMarkdown(t.important)}</p>
                  <ul className="space-y-1 ml-4">
                    {t.importantPoints.map((point, index) => (
                      <li key={index} className="text-sm">• {parseMarkdown(point)}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>

            {/* Responsabilidade */}
            <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50">
              <div className="flex items-start gap-4 mb-4">
                <AlertTriangle className="w-6 h-6 text-destructive mt-1" />
                <h2 className="text-2xl font-semibold text-foreground">{t.responsibilityTitle}</h2>
              </div>
              <div className="space-y-4 text-muted-foreground">
                <p className="leading-relaxed">{parseMarkdown(t.responsibilityDescription)}</p>
                <div className="bg-secondary/20 border border-secondary/20 rounded-lg p-4">
                  <p className="font-semibold text-foreground mb-2">{t.userShouldTitle}</p>
                  <ul className="space-y-1 ml-4">
                    {t.userShouldPoints.map((point, index) => (
                      <li key={index} className="text-sm">• {parseMarkdown(point)}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>

            {/* Como usar o sistema */}
            <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50">
              <div className="flex items-start gap-4 mb-6">
                <Database className="w-6 h-6 text-primary mt-1" />
                <h2 className="text-2xl font-semibold text-foreground">{t.usageTitle}</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Importar */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-success" />
                    <h3 className="text-lg font-semibold text-foreground">{t.importTitle}</h3>
                  </div>
                  <ul className="space-y-2 text-muted-foreground">
                    {t.importSteps.map((step, index) => (
                      <li key={index} className="text-sm">• {parseMarkdown(step)}</li>
                    ))}
                  </ul>
                  <div className="bg-info/10 border border-info/20 rounded-lg p-3">
                    <p className="text-sm text-foreground font-medium">{t.dataLocation}</p>
                    <code className="text-xs bg-muted px-2 py-1 rounded mt-1 inline-block font-mono">
                      {t.dataPath}
                    </code>
                    <p className="text-xs text-muted-foreground mt-2">{parseMarkdown(t.dataNote)}</p>
                  </div>
                </div>

                {/* Exportar */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Download className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">{t.exportTitle}</h3>
                  </div>
                  <ul className="space-y-2 text-muted-foreground">
                    {t.exportSteps.map((step, index) => (
                      <li key={index} className="text-sm">• {parseMarkdown(step)}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>

            {/* Considerações finais */}
            <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50">
              <div className="flex items-start gap-4 mb-4">
                <FileText className="w-6 h-6 text-primary mt-1" />
                <h2 className="text-2xl font-semibold text-foreground">{t.finalTitle}</h2>
              </div>
              <div className="space-y-4 text-muted-foreground">
                <p className="leading-relaxed">{parseMarkdown(t.finalDescription)}</p>
                <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-lg p-4">
                  <Heart className="w-5 h-5 text-primary" />
                  <p className="text-foreground font-medium">{parseMarkdown(t.finalMessage)}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}