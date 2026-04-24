import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Crown, Sparkles, ShieldCheck, Zap, BarChart3 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { setToken } = useAuth();
  const loginMutation = useLogin();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", senha: "" },
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          setToken(data.token);
          toast.success("Bem-vindo de volta! Acesso liberado.");
          setLocation("/");
        },
        onError: (error) => {
          toast.error("Erro ao fazer login. Verifique suas credenciais.");
          console.error(error);
        },
      },
    );
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left form panel */}
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
            Acesso à plataforma Premium
          </div>

          <h2 className="mt-4 text-4xl font-display font-bold leading-tight tracking-tight text-foreground">
            Bem-vindo de volta
          </h2>
          <p className="mt-3 text-base leading-6 text-muted-foreground">
            Não tem uma conta?{" "}
            <Link href="/registro" className="font-semibold text-[hsl(28,85%,42%)] hover:underline underline-offset-4">
              Teste grátis por 7 dias
            </Link>
          </p>

          <div className="mt-10">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Entrando..." : "Entrar na plataforma"}
                </Button>
              </form>
            </Form>

            <div className="my-8 gold-divider" />

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-[hsl(28,85%,42%)]" />
                <span className="text-[11px] font-medium">Multi-tenant</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                <Zap className="h-4 w-4 text-[hsl(28,85%,42%)]" />
                <span className="text-[11px] font-medium">Tempo real</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                <BarChart3 className="h-4 w-4 text-[hsl(28,85%,42%)]" />
                <span className="text-[11px] font-medium">Lucro & BI</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right premium panel */}
      <div className="relative hidden w-0 flex-1 lg:block">
        <div className="absolute inset-0 bg-onyx-gradient aurora-bg flex flex-col items-start justify-between p-14 text-white">
          <div className="relative z-10 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-[hsl(38,92%,70%)]">
            <span className="inline-block h-px w-8 bg-[hsl(38,92%,55%)]" />
            Edição Premium
          </div>

          <div className="relative z-10 max-w-xl">
            <div className="float-slow inline-flex items-center justify-center rounded-2xl bg-white/5 p-5 backdrop-blur-sm border border-white/10 mb-8 glow-pulse">
              <Crown className="h-12 w-12 text-[hsl(38,92%,60%)]" />
            </div>
            <h2 className="font-display text-5xl font-bold leading-[1.1] tracking-tight mb-6">
              A plataforma <span className="text-gold-gradient">premium</span> da assistência técnica brasileira.
            </h2>
            <p className="text-lg text-white/70 leading-relaxed">
              Gestão completa de OS, estoque, PDV e financeiro com scanner em tempo real
              e dashboards de lucratividade. Tudo em um só lugar — feito para quem entende.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-3 gap-6 w-full max-w-xl">
            {[
              { k: "98%", v: "Satisfação" },
              { k: "+10k", v: "OS/mês" },
              { k: "24/7", v: "Suporte" },
            ].map((s) => (
              <div key={s.v}>
                <div className="font-display text-3xl font-bold text-gold-gradient num">{s.k}</div>
                <div className="text-xs uppercase tracking-wider text-white/50 mt-1">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
