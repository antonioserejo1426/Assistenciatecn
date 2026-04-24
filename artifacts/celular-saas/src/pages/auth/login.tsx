import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin, useSistemaGetInfo } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Crown, Sparkles, ShieldCheck, Zap, BarChart3 } from "lucide-react";
import heroImage from "@assets/9FE3B637-3BED-471F-98A6-8CD90C1D69E5_1777058540929.jpeg";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { setToken } = useAuth();
  const loginMutation = useLogin();
  const { data: sistemaInfo } = useSistemaGetInfo({
    query: { staleTime: 0, refetchOnWindowFocus: true },
  });
  const trialDias = sistemaInfo?.trialDiasPadrao ?? 7;

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
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0">
        <img src={heroImage} alt="TecnoFix premium" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/35" />
      </div>
      <div className="relative flex min-h-screen items-center px-4 py-12 sm:px-6 lg:px-20 xl:px-28">
        <div className="mx-auto w-full max-w-md lg:w-[26rem] rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
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

          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[hsl(38,92%,55%)]/30 bg-[hsl(38,92%,55%)]/10 px-3 py-1 text-xs font-medium text-white">
            <Sparkles className="h-3.5 w-3.5" />
            Acesso à plataforma Premium
          </div>

          <h2 className="mt-4 text-4xl font-display font-bold leading-tight tracking-tight text-white">
            Bem-vindo de volta
          </h2>
          <p className="mt-3 text-base leading-6 text-white/75">
            Não tem uma conta?{" "}
            <Link href="/registro" className="font-semibold text-[hsl(28,85%,42%)] hover:underline underline-offset-4">
              {trialDias > 0 ? `Teste grátis por ${trialDias} ${trialDias === 1 ? "dia" : "dias"}` : "Crie sua conta"}
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
                      <FormLabel className="text-xs uppercase tracking-wider text-white/75 font-semibold">
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
                      <FormLabel className="text-xs uppercase tracking-wider text-white/75 font-semibold">
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

            <div className="my-8 border-t border-white/15" />

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="flex flex-col items-center gap-1.5 text-white/70">
                <ShieldCheck className="h-4 w-4 text-[hsl(28,85%,42%)]" />
                <span className="text-[11px] font-medium">Multi-tenant</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 text-white/70">
                <Zap className="h-4 w-4 text-[hsl(28,85%,42%)]" />
                <span className="text-[11px] font-medium">Tempo real</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 text-white/70">
                <BarChart3 className="h-4 w-4 text-[hsl(28,85%,42%)]" />
                <span className="text-[11px] font-medium">Lucro & BI</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
