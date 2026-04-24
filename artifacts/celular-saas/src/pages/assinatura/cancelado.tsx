import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

export default function AssinaturaCancelado() {
  return (
    <div className="flex h-screen items-center justify-center bg-background p-6">
      <div className="max-w-md text-center">
        <XCircle className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
        <h1 className="mb-2 text-2xl font-bold">Pagamento cancelado</h1>
        <p className="mb-6 text-muted-foreground">
          Você pode tentar novamente quando quiser. Seu trial continua ativo.
        </p>
        <Button asChild>
          <Link href="/assinatura">Voltar para planos</Link>
        </Button>
      </div>
    </div>
  );
}
