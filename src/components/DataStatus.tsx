import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface DataStats {
  oils: number | null;
  recipes: number | null;
  loading: boolean;
}

export const DataStatus = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState<DataStats>({
    oils: null,
    recipes: null,
    loading: true,
  });

  useEffect(() => {
    const checkDataFiles = async () => {
      try {
        const [oilsResponse, recipesResponse] = await Promise.allSettled([
          fetch('/data/oils_catalog.json'),
          fetch('/data/recipes_catalog.json'),
        ]);

        let oilsCount = null;
        let recipesCount = null;

        if (oilsResponse.status === 'fulfilled' && oilsResponse.value.ok) {
          const oilsData = await oilsResponse.value.json();
          oilsCount = Array.isArray(oilsData) ? oilsData.length : 0;
        }

        if (recipesResponse.status === 'fulfilled' && recipesResponse.value.ok) {
          const recipesData = await recipesResponse.value.json();
          // Handle different structures - direct array or object with recipes property
          if (Array.isArray(recipesData)) {
            recipesCount = recipesData.length;
          } else if (recipesData.recipes && Array.isArray(recipesData.recipes)) {
            recipesCount = recipesData.recipes.length;
          } else {
            recipesCount = 0;
          }
        }

        setStats({
          oils: oilsCount,
          recipes: recipesCount,
          loading: false,
        });
      } catch (error) {
        setStats({
          oils: null,
          recipes: null,
          loading: false,
        });
      }
    };

    checkDataFiles();
  }, []);

  if (stats.loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5" />
            <h3 className="font-semibold">{t('home.status.title')}</h3>
          </div>
          <div className="flex gap-4">
            <div className="animate-pulse bg-muted rounded h-6 w-20"></div>
            <div className="animate-pulse bg-muted rounded h-6 w-24"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5" />
          <h3 className="font-semibold">{t('home.status.title')}</h3>
        </div>
        <div className="flex flex-wrap gap-3" aria-live="polite">
          <Badge variant={stats.oils !== null ? "default" : "destructive"} className="gap-1">
            {stats.oils !== null ? (
              <>
                {t('home.status.oils')}: {stats.oils} {t('home.status.items')}
              </>
            ) : (
              <>
                <AlertTriangle className="w-3 h-3" />
                {t('home.status.oils')}: {t('home.status.missing')}
              </>
            )}
          </Badge>
          <Badge variant={stats.recipes !== null ? "default" : "destructive"} className="gap-1">
            {stats.recipes !== null ? (
              <>
                {t('home.status.recipes')}: {stats.recipes} {t('home.status.items')}
              </>
            ) : (
              <>
                <AlertTriangle className="w-3 h-3" />
                {t('home.status.recipes')}: {t('home.status.missing')}
              </>
            )}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};