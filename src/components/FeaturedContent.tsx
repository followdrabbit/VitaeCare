import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Droplets, 
  Clock, 
  Users, 
  TrendingUp, 
  Star, 
  ArrowRight,
  Leaf,
  Heart,
  Brain
} from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

export const FeaturedContent = () => {
  const { t } = useLanguage();
  const featuredRecipes = [
    {
      id: 1,
      title: "Blend Anti-Ansiedade",
      description: "Mistura calmante com lavanda, bergamota e ylang-ylang",
      application: "Difusor",
      difficulty: "Iniciante",
      ingredients: 3,
      icon: Brain,
      color: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
    },
    {
      id: 2,
      title: "Óleo Cicatrizante",
      description: "Fórmula regenerativa para pele sensível",
      application: "Massagem",
      difficulty: "Intermediário",
      ingredients: 5,
      icon: Heart,
      color: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
    },
    {
      id: 3,
      title: "Spray Purificador",
      description: "Higienização natural de ambientes",
      application: "Spray",
      difficulty: "Iniciante",
      ingredients: 4,
      icon: Droplets,
      color: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
    }
  ];

  const featuredOils = [
    {
      name: "Lavandula angustifolia",
      common: "Lavanda Verdadeira",
      properties: ["Calmante", "Cicatrizante", "Antibacteriano"],
      safety: "Seguro para todas as idades",
      trending: true
    },
    {
      name: "Melaleuca alternifolia",
      common: "Tea Tree",
      properties: ["Antifúngico", "Antibacteriano", "Anti-inflamatório"],
      safety: "Evitar uso puro na pele",
      trending: false
    },
    {
      name: "Eucalyptus globulus",
      common: "Eucalipto",
      properties: ["Expectorante", "Descongestionante", "Energizante"],
      safety: "Contraindicado < 3 anos",
      trending: true
    }
  ];

  return (
    <section className="py-16 bg-gradient-soft">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            {t('featured.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('featured.recipes.description')}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Featured Recipes */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-foreground flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span>{t('featured.popular')}</span>
              </h3>
              <Button asChild variant="ghost" size="sm">
                <Link to="/receitas" className="flex items-center space-x-1">
                  <span>{t('featured.viewAll')}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>

            <div className="space-y-4">
              {featuredRecipes.map((recipe) => (
                <Card key={recipe.id} className="hover:shadow-card transition-all duration-200 cursor-pointer group">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <div className={`p-2 rounded-lg ${recipe.color}`}>
                        <recipe.icon className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {recipe.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {recipe.description}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span className="flex items-center space-x-1">
                              <Droplets className="w-3 h-3" />
                              <span>{recipe.application}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Users className="w-3 h-3" />
                              <span>{recipe.difficulty}</span>
                            </span>
                          </div>
                          
                          <Badge variant="secondary" className="text-xs">
                            {recipe.ingredients} {t('featured.ingredients')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Featured Oils */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-foreground flex items-center space-x-2">
                <Leaf className="w-5 h-5 text-primary" />
                <span>{t('featured.oils.featured')}</span>
              </h3>
              <Button asChild variant="ghost" size="sm">
                <Link to="/oleos" className="flex items-center space-x-1">
                  <span>{t('featured.viewAll.oils')}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>

            <div className="space-y-4">
              {featuredOils.map((oil, index) => (
                <Card key={index} className="hover:shadow-card transition-all duration-200 cursor-pointer group">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center space-x-2">
                          <span>{oil.common}</span>
                          {oil.trending && (
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          )}
                        </h4>
                        <p className="text-sm text-muted-foreground italic">
                          {oil.name}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {oil.properties.map((prop, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {prop}
                          </Badge>
                        ))}
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">{t('featured.safety.label')}:</span> {oil.safety}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="text-center p-6 hover:shadow-glow transition-all duration-300 cursor-pointer group">
            <CardContent className="space-y-4">
              <div className="w-12 h-12 bg-primary-soft rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">{t('featured.daily.recipe')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('featured.daily.recipe.desc')}
              </p>
              <Button variant="soft" size="sm">{t('featured.view')}</Button>
            </CardContent>
          </Card>

          <Card className="text-center p-6 hover:shadow-glow transition-all duration-300 cursor-pointer group">
            <CardContent className="space-y-4">
              <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Leaf className="w-6 h-6 text-accent-foreground" />
              </div>
              <h3 className="font-semibold text-foreground">{t('featured.daily.oil')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('featured.daily.oil.desc')}
              </p>
              <Button variant="soft" size="sm">{t('featured.explore')}</Button>
            </CardContent>
          </Card>

          <Card className="text-center p-6 hover:shadow-glow transition-all duration-300 cursor-pointer group">
            <CardContent className="space-y-4">
              <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Star className="w-6 h-6 text-success" />
              </div>
              <h3 className="font-semibold text-foreground">{t('featured.news')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('featured.news.desc')}
              </p>
              <Button variant="soft" size="sm">{t('featured.check')}</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};