import {
  useDashboardResumo,
  useDashboardVendasRecentes,
  useDashboardTopProdutos,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  Wrench,
  AlertTriangle,
  TrendingUp,
  Package,
  Sparkles,
  ShoppingCart,
  Crown,
  ArrowUpRight,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "wouter";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export default function Dashboard() {
  const { user, empresa, assinaturaStatus } = useAuth();
  const { data: resumo, isLoading: isLoadingResumo } = useDashboardResumo();
  const { data: vendasRecentes, isLoading: isLoadingVendas } = useDashboardVendasRecentes();
  const { data: topProdutos, isLoading: isLoadingTop } = useDashboardTopProdutos();

  if (isLoadingResumo || isLoadingVendas || isLoadingTop) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="card-luxe px-8 py-6 flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-gold-gradient animate-pulse" />
          <span className="text-muted-foreground">Carregando seu painel premium...</span>
        </div>
      </div>
    );
  }

  const primeiroNome = (user?.nome || "").split(" ")[0] || "";

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="card-luxe card-luxe-elevated stat-card overflow-hidden">
        <div className="relative aurora-bg p-8 lg:p-10">
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(38,92%,55%)]/30 bg-[hsl(38,92%,55%)]/10 px-3 py-1 text-xs font-medium text-[hsl(28,85%,38%)]">
                <Sparkles className="h-3.5 w-3.5" />
                {assinaturaStatus === "trial"
                  ? "Você está no plano Trial Premium"
                  : "Conta Premium ativa"}
              </div>
              <h1 className="mt-4 font-display text-4xl lg:text-5xl font-bold tracking-tight">
                {greeting()}, <span className="text-gold-gradient">{primeiroNome || "bem-vindo"}</span>!
              </h1>
              <p className="mt-3 text-base lg:text-lg text-muted-foreground max-w-xl">
                {empresa?.nome ? (
                  <>
                    Aqui está a visão de hoje da <span className="font-semibold text-foreground">{empresa.nome}</span>.
                    Tudo está rodando — confira seus números e mantenha o ritmo.
                  </>
                ) : (
                  <>Seu painel premium está pronto. Acompanhe vendas, lucro e estoque em tempo real.</>
                )}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild className="btn-luxe rounded-xl h-11 px-5">
                <Link href="/pdv">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Abrir PDV
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl h-11 px-5 border-foreground/15 hover:bg-foreground/5">
                <Link href="/servicos">
                  <Wrench className="mr-2 h-4 w-4" />
                  Nova OS
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={<DollarSign className="h-5 w-5" />}
          label="Faturamento (mês)"
          value={formatCurrency(resumo?.faturamentoMes || 0)}
          accent="gold"
        />
        <KpiCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Lucro (mês)"
          value={formatCurrency(resumo?.lucroMes || 0)}
          accent="green"
        />
        <KpiCard
          icon={<Wrench className="h-5 w-5" />}
          label="Serviços abertos"
          value={String(resumo?.servicosAbertos || 0)}
          accent="onyx"
        />
        <KpiCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Estoque baixo"
          value={String(resumo?.estoqueBaixo || 0)}
          accent="rose"
        />
      </div>

      {/* Chart + Top products */}
      <div className="grid gap-5 md:grid-cols-7">
        <div className="card-luxe md:col-span-4 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-xl font-bold">Faturamento vs Lucro</h3>
              <p className="text-sm text-muted-foreground">Últimos 30 dias</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <LegendDot color="hsl(38,92%,50%)" label="Faturamento" />
              <LegendDot color="#10b981" label="Lucro" />
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={resumo?.faturamentoSerie || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(38, 92%, 55%)" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="hsl(38, 92%, 55%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="data"
                  tickFormatter={(v) => format(new Date(v), "dd/MM", { locale: ptBR })}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `R$ ${value}`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid hsl(var(--border))",
                    boxShadow: "0 12px 30px -10px rgba(20,20,30,.18)",
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => format(new Date(label), "dd 'de' MMMM", { locale: ptBR })}
                />
                <Area
                  type="monotone"
                  dataKey="valor"
                  name="Faturamento"
                  stroke="hsl(38, 92%, 50%)"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorFaturamento)"
                />
                <Area
                  type="monotone"
                  dataKey="lucro"
                  name="Lucro"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorLucro)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-luxe md:col-span-3 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-xl font-bold">Top Produtos</h3>
              <p className="text-sm text-muted-foreground">Mais vendidos</p>
            </div>
            <Link
              href="/produtos"
              className="inline-flex items-center gap-1 text-sm font-medium text-[hsl(28,85%,42%)] hover:underline underline-offset-4"
            >
              Ver todos <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-4">
            {topProdutos?.map((produto, idx) => (
              <div key={produto.produtoId} className="flex items-center group">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(38,92%,92%)] to-[hsl(38,92%,82%)] text-[hsl(28,85%,38%)] ring-1 ring-[hsl(38,92%,55%)]/20">
                  <Package className="h-5 w-5" />
                  {idx === 0 && (
                    <Crown className="absolute -top-1.5 -right-1.5 h-4 w-4 text-[hsl(38,92%,50%)] drop-shadow" />
                  )}
                </div>
                <div className="ml-4 space-y-0.5 flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-none truncate">{produto.nome}</p>
                  <p className="text-xs text-muted-foreground">{produto.quantidade} un. vendidas</p>
                </div>
                <div className="ml-auto font-bold num text-sm">{formatCurrency(produto.faturamento)}</div>
              </div>
            ))}
            {(!topProdutos || topProdutos.length === 0) && (
              <div className="text-center text-muted-foreground py-10">
                <Package className="mx-auto h-8 w-8 opacity-30 mb-2" />
                <p className="text-sm">Nenhum dado de vendas ainda.</p>
                <p className="text-xs mt-1">Realize sua primeira venda no PDV.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent sales */}
      {vendasRecentes && vendasRecentes.length > 0 && (
        <div className="card-luxe p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-xl font-bold">Vendas recentes</h3>
              <p className="text-sm text-muted-foreground">Últimas transações registradas</p>
            </div>
            <Link
              href="/vendas"
              className="inline-flex items-center gap-1 text-sm font-medium text-[hsl(28,85%,42%)] hover:underline underline-offset-4"
            >
              Ver todas <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {vendasRecentes.slice(0, 6).map((v) => (
              <div key={v.id} className="flex items-center py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                  <DollarSign className="h-4 w-4" />
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{v.cliente || "Venda balcão"}</p>
                  <p className="text-xs text-muted-foreground">
                    {v.criadoEm
                      ? format(new Date(v.criadoEm), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })
                      : ""}
                  </p>
                </div>
                <div className="font-bold num">{formatCurrency(Number(v.total) || 0)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: "gold" | "green" | "rose" | "onyx";
}) {
  const accentClasses: Record<string, string> = {
    gold: "bg-gradient-to-br from-[hsl(38,92%,92%)] to-[hsl(38,92%,82%)] text-[hsl(28,85%,38%)] ring-[hsl(38,92%,55%)]/25",
    green: "bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-700 ring-emerald-200",
    rose: "bg-gradient-to-br from-rose-50 to-rose-100 text-rose-700 ring-rose-200",
    onyx: "bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 ring-slate-300",
  };
  const valueColor: Record<string, string> = {
    gold: "text-foreground",
    green: "text-emerald-600",
    rose: "text-rose-600",
    onyx: "text-foreground",
  };
  return (
    <div className="card-luxe stat-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
          <p className={`mt-3 font-display text-3xl font-bold tracking-tight num ${valueColor[accent]}`}>{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${accentClasses[accent]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-muted-foreground">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
