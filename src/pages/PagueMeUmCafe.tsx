import { Navigation } from "@/components/Navigation";
import { Donation } from "@/components/Donation";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PagueMeUmCafe() {
  const { t } = useLanguage();

  return (
    <>
      <title>{t('donation.title')} - AromaGuia</title>
      <meta name="description" content={t('donation.subtitle')} />
      <Navigation />
      <Donation />
    </>
  );
}