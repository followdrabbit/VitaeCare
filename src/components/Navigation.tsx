import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Leaf, Search, BookOpen, FileText, Menu, Moon, Sun, Settings, Coffee } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";

export const Navigation = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const location = useLocation();
  const { t } = useLanguage();

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const navItems = [
    { href: "/", label: t('nav.home'), icon: Leaf },
    { href: "/instrucoes", label: t('nav.instructions'), icon: FileText },
    { href: "/oleos", label: t('nav.essentialOils'), icon: Search },
    { href: "/receitas", label: t('nav.recipes'), icon: BookOpen },
    { href: "/admin/catalogo", label: t('nav.admin'), icon: Settings },
    { href: "/pague-me-um-cafe", label: t('nav.about'), icon: Coffee },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-card/95 backdrop-blur-sm border-b border-border sticky top-0 z-50 shadow-soft">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
              <Leaf className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">VitaeCare</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Button
                key={item.href}
                asChild
                variant={isActive(item.href) ? "default" : "ghost"}
                size="sm"
                className="transition-all duration-200"
              >
                <Link to={item.href} className="flex items-center space-x-2">
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              </Button>
            ))}
          </div>

          {/* Theme Toggle, Language Selector & Mobile Menu */}
          <div className="flex items-center space-x-2">
            <LanguageSelector />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </Button>

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <div className="flex flex-col space-y-4 mt-8">
                  {navItems.map((item) => (
                    <Button
                      key={item.href}
                      asChild
                      variant={isActive(item.href) ? "default" : "ghost"}
                      className="justify-start"
                    >
                      <Link to={item.href} className="flex items-center space-x-2">
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    </Button>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};