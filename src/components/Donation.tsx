import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { 
  Coffee, 
  Copy, 
  ExternalLink, 
  CreditCard, 
  Coins, 
  GraduationCap, 
  MessageCircle,
  Linkedin,
  Github,
  Globe
} from "lucide-react";

export const Donation = () => {
  const { t } = useLanguage();
  const { toast } = useToast();

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: `${label} ${t('donation.copied')}`,
        description: `${text} ${t('donation.copiedToClipboard')}`,
      });
    } catch (err) {
      toast({
        title: t('donation.copyError'),
        description: t('donation.copyErrorDesc'),
        variant: "destructive",
      });
    }
  };

  const pixKey = "raphael.tecsp@gmail.com";
  const ethAddress = "0x5f9f4B61d032a8F4fD74Cd3f9A8E5668b8aEc40A";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <Coffee className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">{t('donation.title')}</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('donation.subtitle')}
          </p>
        </div>

        {/* Author Message */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              {t('donation.authorMessage.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {t('donation.authorMessage.timeInvested')}
            </p>
            <p className="text-muted-foreground">
              {t('donation.authorMessage.investment')}
            </p>
            <p className="text-muted-foreground">
              {t('donation.authorMessage.openSource')}
            </p>
            <p className="text-muted-foreground">
              {t('donation.authorMessage.futureIdeas')}
            </p>
            <p className="font-medium">
              {t('donation.authorMessage.encouragement')}
            </p>
          </CardContent>
        </Card>

        {/* Donation Methods */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Brazil - PIX */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🇧🇷</span>
                {t('donation.brazil.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-secondary/20 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">PIX:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-background rounded text-sm font-mono">
                    {pixKey}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(pixKey, "PIX")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* International */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {t('donation.international.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <a
                  href="https://wise.com/pay/me/raphaeld2223"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  Wise Pay
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Crypto */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                {t('donation.crypto.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-secondary/20 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Ethereum (ETH):</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-background rounded text-sm font-mono break-all">
                    {ethAddress}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(ethAddress, "ETH")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Sections */}
        <div className="mt-8">
          {/* Training */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                {t('donation.training.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                {t('donation.training.description')}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a
                    href="https://n8n.io/creators/followdrabbit/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <Globe className="h-4 w-4" />
                    N8N Creator
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href="https://github.com/followdrabbit"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <Github className="h-4 w-4" />
                    GitHub
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href="https://www.linkedin.com/in/raphaelflorencio/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};