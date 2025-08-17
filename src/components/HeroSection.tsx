import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Shield, Beaker, Database, Settings, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import heroImage from "@/assets/hero-aromatherapy.jpg";

export const HeroSection = () => {
  const { t } = useLanguage();
  
  return (
    <>
      <section className="relative min-h-[80vh] flex items-center overflow-hidden">
        {/* Background with overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-1 gap-12 items-center justify-center">
            {/* Hero Content */}
            <div className="space-y-8 animate-fade-in text-center">
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                  {t('hero.title')}
                </h1>
                
                <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                  {t('hero.description')}
                </p>
              </div>

              {/* Call to Action Button */}
              <div className="flex justify-center">
                <Button asChild variant="default" size="lg" className="shadow-lg">
                  <Link to="/instrucoes" className="flex items-center space-x-2">
                    <span>{t('home.cta.start.here')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};