import { ReactNode } from "react";
import { Link } from "wouter";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

const FEATURE_LABELS: Record<string, { titulo: string; descricao: string; planoMin: string }> = {
  tecnicos: {
    titulo: "Gestão de Técnicos",
    descricao: "Cadastre técnicos, atribua serviços e acompanhe a produtividade da sua equipe.",
    planoMin: "Profissional",
  },
  servicos: {
    titulo: "Ordens de Serviço",
    descricao: "Controle completo de OS: status, peças usadas, prazos e histórico do cliente.",
    planoMin: "Profissional",
  },
  lucratividade: {
    titulo: "Dashboard de Lucratividade",
    descricao: "Veja lucro líquido, margens e indicadores em tempo real.",
    planoMin: "Profissional",
  },
  filiais: {
    titulo: "Múltiplas Filiais",
    descricao: "Gerencie várias lojas em um único painel.",
    planoMin: "Premium",
  },
  relatorios_avancados: {
    titulo: "Relatórios Avançados",
    descricao: "Análises detalhadas e exportações personalizadas.",
    planoMin: "Premium",
  },
};

export function FeatureGate({ feature, children }: { feature: string; children: ReactNode }) {
  const { hasFeature, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  const info = FEATURE_LABELS[feature] ?? {
    titulo: "Recurso indisponível",
    descricao: "Este recurso não está disponível no seu plano atual.",
    planoMin: "Profissional",
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="card-luxe card-luxe-elevated max-w-lg text-center p-10">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[hsl(38,92%,55%)]/10 text-[hsl(38,92%,55%)] border border-[hsl(38,92%,55%)]/20">
          <Lock className="h-8 w-8" />
        </div>
        <h2 className="font-display text-2xl font-bold mb-2">{info.titulo}</h2>
        <p className="text-muted-foreground mb-2">{info.descricao}</p>
        <p className="text-sm text-[hsl(38,92%,55%)] font-semibold uppercase tracking-wider mb-6">
          Disponível no plano {info.planoMin} ou superior
        </p>
        <Button asChild size="lg" className="btn-luxe rounded-xl">
          <Link href="/assinatura">
            <Sparkles className="mr-2 h-4 w-4" />
            Fazer Upgrade
          </Link>
        </Button>
      </div>
    </div>
  );
}
