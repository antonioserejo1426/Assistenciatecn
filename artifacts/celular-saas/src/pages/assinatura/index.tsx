import { toast } from "sonner";
import {
  useGetAssinatura,
  useListPlanos,
  useCreateCheckout,
  useCreatePortal,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard, Sparkles } from "lucide-react";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function AssinaturaPage() {
  const { data: assinatura } = useGetAssinatura();
  const { data: planos = [] } = useListPlanos();
  const checkout = useCreateCheckout();
  const portal = useCreatePortal();

  async function assinar(planoId: number, pularTrial = false) {
    try {
      const r = await checkout.mutateAsync({ data: { planoId, pularTrial } });
      window.location.href = r.url;
    } catch (e) {
      toast.error("Não foi possível iniciar o checkout. Configure o Stripe primeiro.");
    }
  }

  async function abrirPortal() {
    try {
      const r = await portal.mutateAsync();
      window.location.href = r.url;
    } catch {
      toast.error("Não foi possível abrir o portal de cobrança");
    }
  }

  const statusBadgeColor =
    assinatura?.status === "ativa"
      ? "bg-emerald-500"
      : assinatura?.status === "trial"
        ? "bg-blue-500"
        : "bg-destructive";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Assinatura</h1>
        <p className="text-sm text-muted-foreground">Gerencie seu plano e pagamento</p>
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
            <Badge className={statusBadgeColor + " text-white capitalize"}>
              {assinatura?.status ?? "—"}
            </Badge>
            <span className="text-lg font-semibold">{assinatura?.plano?.nome ?? "Sem plano"}</span>
          </div>
          {assinatura?.plano && (
            <p className="text-sm text-muted-foreground">
              {fmt(assinatura.plano.preco)} / {assinatura.plano.intervalo}
            </p>
          )}
          {assinatura?.proximoVencimento && (
            <p className="text-sm">
              Próximo vencimento:{" "}
              <strong>{new Date(assinatura.proximoVencimento).toLocaleDateString("pt-BR")}</strong>
            </p>
          )}
          <Button variant="outline" onClick={abrirPortal} disabled={portal.isPending}>
            <CreditCard className="mr-2 h-4 w-4" /> Gerenciar pagamento
          </Button>
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
                    <span className="text-sm font-normal text-muted-foreground">/{p.intervalo}</span>
                  </div>
                  <ul className="space-y-1 text-sm">
                    {p.recursos?.map((r, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 flex-none text-green-600" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="space-y-2">
                    <Button
                      className="w-full"
                      variant={ativo ? "outline" : "default"}
                      onClick={() => assinar(p.id, false)}
                      disabled={checkout.isPending || ativo}
                    >
                      {ativo ? "Plano ativo" : "Assinar (com trial)"}
                    </Button>
                    {!ativo && (
                      <Button
                        className="w-full"
                        variant="secondary"
                        onClick={() => assinar(p.id, true)}
                        disabled={checkout.isPending}
                      >
                        Pagar agora (sem trial)
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
