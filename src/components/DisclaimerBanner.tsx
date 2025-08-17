import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

export const DisclaimerBanner = () => {
  const { t } = useLanguage();

  return (
    <Alert role="alert" className="border-warning/50 bg-warning/5">
      <AlertTriangle className="h-4 w-4 text-warning" />
      <AlertTitle className="text-warning">{t('disclaimer.title')}</AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p className="text-sm leading-relaxed">
          {t('disclaimer.message')}
        </p>
        <Button variant="link" size="sm" asChild className="h-auto p-0 text-warning">
          <Link to="/pague-me-um-cafe" className="flex items-center gap-1">
            {t('disclaimer.learn.more')}
            <ExternalLink className="w-3 h-3" />
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
};