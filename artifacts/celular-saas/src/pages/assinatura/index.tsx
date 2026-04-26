import { toast } from "sonner";
import {
  useGetAssinatura,
  useListPlanos,
  useCreateCheckout,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function AssinaturaPage() {
  const { data: assinatura } = useGetAssinatura();
  const { data: planos = [] } = useListPlanos();
  const checkout = useCreateCheckout();

  async function comprar(planoId: number) {
    try {
      const r = await checkout.mutateAsync({ data: { planoId } });
      window.location.href = r.url;
    } catch (e) {
      toast.error("Não foi possível iniciar o pagamento. Configure o Stripe primeiro.");
    }
  }

  const statusBadgeColor =
    assinatura?.status === "ativa"
      ? "bg-emerald-500"
      : assinatura?.status === "pendente"
        ? "bg-amber-500"
        : "bg-destructive";

  const statusLabel =
    assinatura?.status === "ativa"
      ? "Liberado"
      : assinatura?.status === "pendente"
        ? "Aguardando pagamento"
        : assinatura?.status === "falha_pagamento"
          ? "Pagamento não autorizado"
          : assinatura?.status === "reembolsada"
            ? "Reembolsada"
            : assinatura?.status ?? "Sem plano";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Plano</h1>
        <p className="text-sm text-muted-foreground">Pagamento único — acesso vitalício após confirmação</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Plano atual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Badge className={statusBadgeColor + " text-white"}>
              {statusLabel}
            </Badge>
            <span className="text-lg font-semibold">{assinatura?.plano?.nome ?? "Sem plano"}</span>
          </div>
          {assinatura?.plano && (
            <p className="text-sm text-muted-foreground">
              {fmt(assinatura.plano.preco)} — pagamento único
            </p>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Planos disponíveis</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {planos.map((p) => {
            const ativo = assinatura?.planoId === p.id && assinatura?.status === "ativa";
            return (
              <Card key={p.id} className={ativo ? "border-primary" : ""}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {p.nome}
                    {ativo && <Badge>Atual</Badge>}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{p.descricao}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-3xl font-bold">
                    {fmt(p.preco)}
                    <span className="ml-2 text-sm font-normal text-muted-foreground">pagamento único</span>
                  </div>
                  <ul className="space-y-1 text-sm">
                    {p.recursos?.map((r, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 flex-none text-green-600" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={ativo ? "outline" : "default"}
                    onClick={() => comprar(p.id)}
                    disabled={checkout.isPending || ativo}
                  >
                    {ativo ? "Plano ativo" : "Comprar agora"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
