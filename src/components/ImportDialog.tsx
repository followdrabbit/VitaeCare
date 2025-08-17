import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ImportDialog = ({ open, onOpenChange }: ImportDialogProps) => {
  const { t } = useLanguage();
  const [selectedFiles, setSelectedFiles] = useState<{
    oils?: File;
    recipes?: File;
  }>({});

  const handleFileSelect = (type: 'oils' | 'recipes', file: File | null) => {
    setSelectedFiles(prev => ({
      ...prev,
      [type]: file || undefined,
    }));
  };

  const handleImport = () => {
    // Note: In a real implementation, this would handle file uploads
    // For now, just show instructions since there's no backend
    console.log('Import would happen here with files:', selectedFiles);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            {t('import.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Oils Import */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {t('import.oils.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('import.oils.desc')}
              </p>
              <div className="space-y-2">
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => handleFileSelect('oils', e.target.files?.[0] || null)}
                  className="hidden"
                  id="oils-file"
                />
                <Button
                  variant="outline" 
                  className="w-full"
                  onClick={() => document.getElementById('oils-file')?.click()}
                >
                  {selectedFiles.oils ? selectedFiles.oils.name : t('import.choose.file')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recipes Import */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {t('import.recipes.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('import.recipes.desc')}
              </p>
              <div className="space-y-2">
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => handleFileSelect('recipes', e.target.files?.[0] || null)}
                  className="hidden"
                  id="recipes-file"
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => document.getElementById('recipes-file')?.click()}
                >
                  {selectedFiles.recipes ? selectedFiles.recipes.name : t('import.choose.file')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <div className="bg-muted/30 border border-border rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              {t('import.instruction')}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleImport}
            disabled={!selectedFiles.oils && !selectedFiles.recipes}
          >
            {t('import.import')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};