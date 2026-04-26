import { Link } from "wouter";
import { useListPlanos } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  Crown,
  Check,
  Sparkles,
  ShieldCheck,
  Zap,
  BarChart3,
  Star,
  Quote,
  ArrowRight,
} from "lucide-react";
import heroImage from "@assets/9FE3B637-3BED-471F-98A6-8CD90C1D69E5_1777058540929.jpeg";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

type Depoimento = {
  nome: string;
  empresa: string;
  cidade: string;
  texto: string;
  estrelas: number;
};

const depoimentos: Depoimento[] = [
  {
    nome: "Carlos Henrique",
    empresa: "CH Assistência Técnica",
    cidade: "São Paulo · SP",
    texto:
      "Antes eu controlava OS no caderno e perdia peças no estoque. Em duas semanas usando o sistema da Bruno Software já recuperei o que paguei no plano. Hoje sei exatamente quanto cada serviço me dá de lucro.",
    estrelas: 5,
  },
  {
    nome: "Mariana Souza",
    empresa: "Souza Cell",
    cidade: "Belo Horizonte · MG",
    texto:
      "O scanner pelo celular foi o que mais me chamou atenção. Meus técnicos já entram no sistema e atualizam a OS na hora. O suporte da Bruno Software responde rápido e fala a nossa língua.",
    estrelas: 5,
  },
  {
    nome: "Rodrigo Lima",
    empresa: "Lima Tech Reparos",
    cidade: "Recife · PE",
    texto:
      "Tenho duas lojas e finalmente consegui ver tudo num lugar só. Estoque, vendas, comissão de técnico, financeiro. Vale cada centavo do plano Profissional.",
    estrelas: 5,
  },
];

export default function Landing() {
  const { data: planos = [] } = useListPlanos();
  const heroLabel = "Escolha o plano que combina com sua loja";

  const planoMaisPopularId = planos.length >= 2 ? planos[1]?.id : planos[0]?.id;

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-white">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[#0b0b0d]">
          <img
            src={heroImage}
            alt="Bruno Software Solutions"
            className="h-full w-full object-contain opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/55 to-[#0b0b0d]" />
        </div>

        <header className="relative z-10 flex items-center justify-between px-4 py-5 sm:px-8 lg:px-16">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-gradient">
              <Crown className="h-5 w-5 text-[hsl(222,47%,8%)]" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] font-semibold tracking-[0.3em] text-white/70 uppercase">
                Bruno Software Solutions
              </span>
              <span className="text-lg font-display font-bold tracking-tight">
                Tecno<span className="text-gold-gradient">Fix</span>
              </span>
            </div>
          </div>
          <Link
            href="/login"
            className="text-sm font-semibold text-white/80 hover:text-white"
          >
            Já tenho conta
          </Link>
        </header>

        <div className="relative z-10 mx-auto max-w-5xl px-4 pb-20 pt-24 text-center sm:pt-32 lg:pb-32 lg:pt-40">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[hsl(38,92%,55%)]/30 bg-[hsl(38,92%,55%)]/10 px-4 py-1.5 text-xs font-medium text-white">
            <Sparkles className="h-3.5 w-3.5" /> {heroLabel}
          </div>
          <h1 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            A plataforma <span className="text-gold-gradient">premium</span>
            <br className="hidden sm:block" /> da assistência técnica brasileira.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-white/80 sm:text-lg">
            Gestão completa de OS, estoque, PDV, técnicos e financeiro — feita pela
            Bruno Software Solutions para quem vive de consertar celular.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#planos"
              className="btn-luxe inline-flex h-12 items-center justify-center rounded-xl px-7 text-base font-semibold tracking-wide text-[hsl(222,47%,8%)]"
            >
              Ver planos e começar
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-white/30 px-7 text-base font-semibold text-white hover:bg-white/10"
            >
              Entrar
            </Link>
          </div>

          <div className="mx-auto mt-14 grid max-w-3xl grid-cols-3 gap-4 text-center">
            <div className="flex flex-col items-center gap-2 text-white/80">
              <ShieldCheck className="h-5 w-5 text-[hsl(38,92%,65%)]" />
              <span className="text-xs font-medium">Multi-tenant</span>
            </div>
            <div className="flex flex-col items-center gap-2 text-white/80">
              <Zap className="h-5 w-5 text-[hsl(38,92%,65%)]" />
              <span className="text-xs font-medium">Tempo real</span>
            </div>
            <div className="flex flex-col items-center gap-2 text-white/80">
              <BarChart3 className="h-5 w-5 text-[hsl(38,92%,65%)]" />
              <span className="text-xs font-medium">Lucro & BI</span>
            </div>
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section id="planos" className="relative px-4 py-16 sm:px-8 lg:px-16 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[hsl(38,92%,65%)]">
              Planos
            </span>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
              Escolha o plano e crie sua conta
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-white/70">
              Você seleciona o plano, cadastra sua empresa, finaliza o pagamento e o acesso é liberado na hora.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {planos.map((p) => {
              const popular = p.id === planoMaisPopularId;
              return (
                <div
                  key={p.id}
                  className={`relative flex flex-col rounded-2xl border p-6 backdrop-blur ${
                    popular
                      ? "border-[hsl(38,92%,55%)]/60 bg-white/[0.07] shadow-[0_0_40px_hsl(38_92%_55%_/_0.15)]"
                      : "border-white/10 bg-white/[0.04]"
                  }`}
                >
                  {popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold-gradient px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[hsl(222,47%,8%)]">
                      Mais popular
                    </div>
                  )}
                  <h3 className="font-display text-2xl font-bold">{p.nome}</h3>
                  <p className="mt-1 text-sm text-white/60">{p.descricao}</p>
                  <div className="mt-6 flex items-end gap-2">
                    <span className="font-display text-4xl font-bold">{fmt(p.preco)}</span>
                    <span className="pb-1 text-sm text-white/60">pagamento único</span>
                  </div>
                  <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                    {p.recursos?.map((r, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 flex-none text-[hsl(38,92%,65%)]" />
                        <span className="text-white/85">{r}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/registro?plano=${p.id}`}
                    className={
                      popular
                        ? "btn-luxe mt-8 inline-flex h-12 w-full items-center justify-center rounded-xl text-sm font-semibold text-[hsl(222,47%,8%)]"
                        : "mt-8 inline-flex h-12 w-full items-center justify-center rounded-xl border border-white/25 text-sm font-semibold text-white hover:bg-white/10"
                    }
                  >
                    Escolher {p.nome}
                  </Link>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="border-t border-white/5 bg-[#0a0a0c] px-4 py-16 sm:px-8 lg:px-16 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[hsl(38,92%,65%)]">
              Quem usa, recomenda
            </span>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
              Depoimentos de clientes Bruno Software Solutions
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {depoimentos.map((d) => (
              <div
                key={d.nome}
                className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-6"
              >
                <Quote className="h-6 w-6 text-[hsl(38,92%,65%)]" />
                <div className="mt-3 flex gap-1">
                  {Array.from({ length: d.estrelas }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-[hsl(38,92%,60%)] text-[hsl(38,92%,60%)]"
                    />
                  ))}
                </div>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-white/85">
                  "{d.texto}"
                </p>
                <div className="mt-5 border-t border-white/10 pt-4">
                  <div className="font-semibold text-white">{d.nome}</div>
                  <div className="text-xs text-white/60">
                    {d.empresa} · {d.cidade}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="px-4 py-16 sm:px-8 lg:px-16 lg:py-20">
        <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-8 text-center sm:p-12">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Pronto para profissionalizar sua assistência?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/70">
            Crie sua conta agora e comece a controlar OS, estoque e financeiro com a
            Bruno Software Solutions.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#planos"
              className="btn-luxe inline-flex h-12 items-center justify-center rounded-xl px-7 text-base font-semibold text-[hsl(222,47%,8%)]"
            >
              Escolher meu plano
            </a>
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-white/30 px-7 text-base font-semibold text-white hover:bg-white/10"
            >
              Já sou cliente
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 px-4 py-8 text-center text-xs text-white/50">
        © {new Date().getFullYear()} Bruno Software Solutions · TecnoFix
      </footer>
    </div>
  );
}
