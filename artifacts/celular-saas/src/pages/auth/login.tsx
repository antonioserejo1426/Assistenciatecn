import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { messageFromError } from "@/lib/api-error";
import { Crown, Sparkles, ShieldCheck, Zap, BarChart3, X } from "lucide-react";
import heroImage from "@assets/9FE3B637-3BED-471F-98A6-8CD90C1D69E5_1777058540929.jpeg";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

const REMEMBERED_EMAIL_KEY = "tecnofix_remembered_email";

export default function Login() {
  const [, setLocation] = useLocation();
  const { setToken } = useAuth();
  const loginMutation = useLogin();

  const rememberedEmail =
    typeof window !== "undefined" ? localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? "" : "";

  const [rememberMe, setRememberMe] = useState<boolean>(Boolean(rememberedEmail));

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: rememberedEmail, senha: "" },
  });

  useEffect(() => {
    if (rememberedEmail) {
      setTimeout(() => form.setFocus("senha"), 50);
    }
  }, []);

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          setToken(data.token);
          if (rememberMe) {
            localStorage.setItem(REMEMBERED_EMAIL_KEY, values.email);
          } else {
            localStorage.removeItem(REMEMBERED_EMAIL_KEY);
          }
          toast.success("Bem-vindo de volta! Acesso liberado.");
          setLocation("/");
        },
        onError: (error) => {
          toast.error(messageFromError(error, "Erro ao fazer login. Verifique suas credenciais."));
        },
      },
    );
  };

  function trocarUsuario() {
    localStorage.removeItem(REMEMBERED_EMAIL_KEY);
    form.reset({ email: "", senha: "" });
    setRememberMe(false);
    setTimeout(() => form.setFocus("email"), 50);
  }

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
              Crie sua conta
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
                          autoComplete="username"
                          className="h-12 rounded-xl border-input/80 bg-card/60 px-4 text-base focus-visible:ring-2 focus-visible:ring-[hsl(38,92%,55%)]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                      {rememberedEmail && field.value === rememberedEmail && (
                        <button
                          type="button"
                          onClick={trocarUsuario}
                          className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-white/70 hover:text-white transition-colors"
                        >
                          <X className="h-3 w-3" />
                          Não é você? Trocar de conta
                        </button>
                      )}
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
                          autoComplete="current-password"
                          className="h-12 rounded-xl border-input/80 bg-card/60 px-4 text-base focus-visible:ring-2 focus-visible:ring-[hsl(38,92%,55%)]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <Checkbox
                      checked={rememberMe}
                      onCheckedChange={(v) => setRememberMe(v === true)}
                      className="border-white/40 data-[state=checked]:bg-[hsl(28,85%,42%)] data-[state=checked]:border-[hsl(28,85%,42%)]"
                    />
                    <span className="text-sm text-white/85">Lembrar meu email</span>
                  </label>
                  <Link
                    href="/esqueci-senha"
                    className="text-sm font-medium text-[hsl(28,85%,55%)] hover:underline underline-offset-4"
                  >
                    Esqueci a senha
                  </Link>
                </div>

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
