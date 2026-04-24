import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function AssinaturaSucesso() {
  return (
    <div className="flex h-screen items-center justify-center bg-background p-6">
      <div className="max-w-md text-center">
        <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-emerald-500" />
        <h1 className="mb-2 text-2xl font-bold">Assinatura confirmada</h1>
        <p className="mb-6 text-muted-foreground">
          Pronto! Você já pode usar todos os recursos do TecnoFix sem limites.
        </p>
        <Button asChild size="lg">
          <Link href="/">Ir para o painel</Link>
        </Button>
      </div>
    </div>
  );
}
