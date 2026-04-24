import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRegister, useSistemaGetInfo } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Crown, Sparkles, CheckCircle2 } from "lucide-react";

const registerSchema = z.object({
  empresaNome: z.string().min(2, "Nome da empresa deve ter no mínimo 2 caracteres"),
  nome: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export default function Register() {
  const [, setLocation] = useLocation();
  const { setToken } = useAuth();
  const registerMutation = useRegister();
  const { data: sistemaInfo } = useSistemaGetInfo({
    query: { staleTime: 0, refetchOnWindowFocus: true },
  });
  const trialDias = sistemaInfo?.trialDiasPadrao ?? 7;
  const trialLabel = trialDias > 0
    ? `${trialDias} ${trialDias === 1 ? "dia" : "dias"} grátis, sem cartão`
    : "Acesso premium imediato";
  const beneficios = [
    trialLabel,
    "Scanner via celular em tempo real",
    "Dashboard de lucratividade",
    "Suporte premium em português",
  ];

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { empresaNome: "", nome: "", email: "", senha: "" },
  });

  const onSubmit = (values: z.infer<typeof registerSchema>) => {
    registerMutation.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          setToken(data.token);
          toast.success(
            trialDias > 0
              ? `Bem-vindo ao TecnoFix! Seus ${trialDias} ${trialDias === 1 ? "dia" : "dias"} premium começam agora.`
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
    <div className="flex min-h-screen bg-background">
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-28 relative">
        <div className="mx-auto w-full max-w-md lg:w-[26rem] relative z-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gold-gradient gold-ring">
              <Crown className="h-6 w-6 text-[hsl(222,47%,8%)]" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] font-semibold tracking-[0.3em] text-muted-foreground uppercase">
                Premium SaaS
              </span>
              <span className="text-2xl font-display font-bold tracking-tight">
                Tecno<span className="text-gold-gradient">Fix</span>
              </span>
            </div>
          </div>

          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[hsl(38,92%,55%)]/30 bg-[hsl(38,92%,55%)]/10 px-3 py-1 text-xs font-medium text-[hsl(28,85%,38%)]">
            <Sparkles className="h-3.5 w-3.5" />
            Comece agora — sem cartão
          </div>

          <h2 className="mt-4 text-4xl font-display font-bold leading-tight tracking-tight text-foreground">
            Crie sua conta premium
          </h2>
          <p className="mt-3 text-base leading-6 text-muted-foreground">
            Já tem uma conta?{" "}
            <Link href="/login" className="font-semibold text-[hsl(28,85%,42%)] hover:underline underline-offset-4">
              Faça login
            </Link>
          </p>

          <div className="mt-10">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="empresaNome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                        Nome da Assistência
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Sua Assistência Celular"
                          className="h-12 rounded-xl border-input/80 bg-card/60 px-4 text-base focus-visible:ring-2 focus-visible:ring-[hsl(38,92%,55%)]"
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
                      <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                        Seu Nome
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="João Silva"
                          className="h-12 rounded-xl border-input/80 bg-card/60 px-4 text-base focus-visible:ring-2 focus-visible:ring-[hsl(38,92%,55%)]"
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
                      <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="seu@email.com"
                          className="h-12 rounded-xl border-input/80 bg-card/60 px-4 text-base focus-visible:ring-2 focus-visible:ring-[hsl(38,92%,55%)]"
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
                      <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                        Senha
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="h-12 rounded-xl border-input/80 bg-card/60 px-4 text-base focus-visible:ring-2 focus-visible:ring-[hsl(38,92%,55%)]"
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

      {/* Right premium panel */}
      <div className="relative hidden w-0 flex-1 lg:block">
        <div className="absolute inset-0 bg-onyx-gradient aurora-bg flex flex-col justify-between p-14 text-white">
          <div className="relative z-10 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-[hsl(38,92%,70%)]">
            <span className="inline-block h-px w-8 bg-[hsl(38,92%,55%)]" />
            Edição Premium
          </div>

          <div className="relative z-10 max-w-xl">
            <h2 className="font-display text-5xl font-bold leading-[1.1] tracking-tight mb-6">
              Eleve sua assistência ao <span className="text-gold-gradient">próximo nível</span>.
            </h2>
            <p className="text-lg text-white/70 leading-relaxed mb-10">
              Junte-se às oficinas que escolheram a forma premium de gerenciar OS, estoque e PDV — tudo conectado em tempo real.
            </p>

            <ul className="space-y-3">
              {beneficios.map((b) => (
                <li key={b} className="flex items-center gap-3 text-white/90">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[hsl(38,92%,55%)]/15 ring-1 ring-[hsl(38,92%,55%)]/40">
                    <CheckCircle2 className="h-4 w-4 text-[hsl(38,92%,65%)]" />
                  </span>
                  <span className="font-medium">{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative z-10 text-sm text-white/50">
            "O TecnoFix transformou como organizamos a oficina. Hoje vendemos mais e perdemos zero peça."
            <div className="mt-2 text-white/70 font-medium">— Cliente Premium</div>
          </div>
        </div>
      </div>
    </div>
  );
}
