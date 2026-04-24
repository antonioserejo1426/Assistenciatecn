import { useLocation, Link, useSearch } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useRegister,
  useSistemaGetInfo,
  useListPlanos,
  useCreateCheckout,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Crown, Sparkles, Check } from "lucide-react";
import heroImage from "@assets/9FE3B637-3BED-471F-98A6-8CD90C1D69E5_1777058540929.jpeg";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const registerSchema = z.object({
  empresaNome: z.string().min(2, "Nome da empresa deve ter no mínimo 2 caracteres"),
  nome: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export default function Register() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const planoIdParam = new URLSearchParams(search).get("plano");
  const planoIdSelecionado = planoIdParam ? Number(planoIdParam) : null;

  const { setToken } = useAuth();
  const registerMutation = useRegister();
  const checkoutMutation = useCreateCheckout();
  const { data: sistemaInfo } = useSistemaGetInfo({
    query: { staleTime: 0, refetchOnWindowFocus: true },
  });
  const { data: planos = [] } = useListPlanos();
  const planoSelecionado =
    planoIdSelecionado != null
      ? planos.find((p) => p.id === planoIdSelecionado) ?? null
      : null;
  const trialDias = sistemaInfo?.trialDiasPadrao ?? 7;

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { empresaNome: "", nome: "", email: "", senha: "" },
  });

  const onSubmit = (values: z.infer<typeof registerSchema>) => {
    registerMutation.mutate(
      { data: values },
      {
        onSuccess: async (data) => {
          setToken(data.token);
          if (planoSelecionado) {
            toast.success(`Conta criada! Vamos para o pagamento do plano ${planoSelecionado.nome}.`);
            try {
              const r = await checkoutMutation.mutateAsync({
                data: { planoId: planoSelecionado.id },
              });
              window.location.href = r.url;
              return;
            } catch {
              toast.error(
                "Conta criada, mas não foi possível abrir o pagamento. Você está no período de teste — é só ir em Assinatura para ativar o plano.",
              );
              setLocation("/");
              return;
            }
          }
          toast.success(
            trialDias > 0
              ? `Bem-vindo ao TecnoFix! Seus ${trialDias} ${trialDias === 1 ? "dia" : "dias"} grátis começam agora.`
              : "Bem-vindo ao TecnoFix!",
          );
          setLocation("/");
        },
        onError: (error) => {
          toast.error("Erro ao criar conta. Verifique os dados e tente novamente.");
          console.error(error);
        },
      },
    );
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 bg-[#0b0b0d]">
        <img src={heroImage} alt="TecnoFix premium" className="h-full w-full object-contain" />
        <div className="absolute inset-0 bg-black/40" />
      </div>
      <div className="relative flex min-h-screen flex-col justify-end px-4 pb-6 pt-6 sm:px-6 lg:justify-center lg:px-20 lg:pb-12 lg:pt-12 xl:px-28">
        <div className="mx-auto w-full max-w-md lg:w-[26rem] rounded-3xl border border-white/20 bg-black/55 p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-10">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gold-gradient gold-ring">
              <Crown className="h-6 w-6 text-[hsl(222,47%,8%)]" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] font-semibold tracking-[0.3em] text-white/70 uppercase">
                Premium SaaS
              </span>
              <span className="text-2xl font-display font-bold tracking-tight text-white">
                Tecno<span className="text-gold-gradient">Fix</span>
              </span>
            </div>
          </div>

          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[hsl(38,92%,55%)]/30 bg-[hsl(38,92%,55%)]/10 px-3 py-1 text-xs font-medium text-white">
            <Sparkles className="h-3.5 w-3.5" />
            {planoSelecionado ? `Plano ${planoSelecionado.nome} selecionado` : "Comece agora — sem cartão"}
          </div>

          <h2 className="mt-4 text-4xl font-display font-bold leading-tight tracking-tight text-white">
            {planoSelecionado ? "Crie sua conta para assinar" : "Crie sua conta premium"}
          </h2>
          <p className="mt-3 text-base leading-6 text-white/75">
            Já tem uma conta?{" "}
            <Link
              href={planoSelecionado ? `/login` : "/login"}
              className="font-semibold text-[hsl(38,92%,65%)] hover:underline underline-offset-4"
            >
              Faça login
            </Link>
          </p>

          {planoSelecionado && (
            <div className="mt-5 rounded-2xl border border-[hsl(38,92%,55%)]/40 bg-[hsl(38,92%,55%)]/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[hsl(38,92%,75%)]">
                    Plano escolhido
                  </div>
                  <div className="mt-1 font-display text-xl font-bold text-white">
                    {planoSelecionado.nome}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-2xl font-bold text-white">
                    {fmt(planoSelecionado.preco)}
                  </div>
                  <div className="text-[11px] text-white/70">/{planoSelecionado.intervalo}</div>
                </div>
              </div>
              {planoSelecionado.recursos && planoSelecionado.recursos.length > 0 && (
                <ul className="mt-3 space-y-1.5 text-xs text-white/80">
                  {planoSelecionado.recursos.slice(0, 3).map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 flex-none text-[hsl(38,92%,65%)]" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              )}
              <Link
                href="/"
                className="mt-3 inline-block text-[11px] font-semibold text-white/70 hover:text-white"
              >
                Trocar plano
              </Link>
            </div>
          )}

          <div className="mt-10">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="empresaNome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase tracking-wider text-white/75 font-semibold">
                        Nome da Assistência
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Sua Assistência Celular"
                          className="h-12 rounded-xl border-white/20 bg-white/10 px-4 text-base text-white placeholder:text-white/40 focus-visible:ring-2 focus-visible:ring-[hsl(38,92%,55%)]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase tracking-wider text-white/75 font-semibold">
                        Seu Nome
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="João Silva"
                          className="h-12 rounded-xl border-white/20 bg-white/10 px-4 text-base text-white placeholder:text-white/40 focus-visible:ring-2 focus-visible:ring-[hsl(38,92%,55%)]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase tracking-wider text-white/75 font-semibold">
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="seu@email.com"
                          className="h-12 rounded-xl border-white/20 bg-white/10 px-4 text-base text-white placeholder:text-white/40 focus-visible:ring-2 focus-visible:ring-[hsl(38,92%,55%)]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="senha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase tracking-wider text-white/75 font-semibold">
                        Senha
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="h-12 rounded-xl border-white/20 bg-white/10 px-4 text-base text-white placeholder:text-white/40 focus-visible:ring-2 focus-visible:ring-[hsl(38,92%,55%)]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="btn-luxe h-12 w-full rounded-xl text-base font-semibold tracking-wide"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending
                    ? "Criando sua conta..."
                    : trialDias > 0
                      ? `Começar ${trialDias} ${trialDias === 1 ? "dia" : "dias"} premium`
                      : "Criar conta premium"}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
