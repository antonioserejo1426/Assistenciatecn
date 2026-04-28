import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { customFetch, ApiError } from "@workspace/api-client-react";
import { messageFromError } from "@/lib/api-error";
import { Crown, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import heroImage from "@assets/9FE3B637-3BED-471F-98A6-8CD90C1D69E5_1777058540929.jpeg";

const schema = z.object({
  email: z.string().email("Email inválido"),
});

export default function ForgotPassword() {
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    setLoading(true);
    try {
      await customFetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      setEnviado(true);
    } catch (err) {
      toast.error(messageFromError(err as ApiError, "Erro ao solicitar redefinição. Tente novamente."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 bg-[#0b0b0d]">
        <img src={heroImage} alt="TecnoFix" className="h-full w-full object-contain" />
        <div className="absolute inset-0 bg-black/50" />
      </div>
      <div className="relative flex min-h-screen flex-col justify-end px-4 pb-6 pt-6 sm:px-6 lg:justify-center lg:px-20 lg:pb-12 lg:pt-12 xl:px-28">
        <div className="mx-auto w-full max-w-md lg:w-[26rem] rounded-3xl border border-white/20 bg-black/55 p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gold-gradient gold-ring">
              <Crown className="h-6 w-6 text-[hsl(222,47%,8%)]" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] font-semibold tracking-[0.3em] text-muted-foreground uppercase">
                Recuperar acesso
              </span>
              <span className="text-2xl font-display font-bold tracking-tight">
                Tecno<span className="text-gold-gradient">Fix</span>
              </span>
            </div>
          </div>

          {enviado ? (
            <div className="space-y-5 text-white">
              <div className="flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                <div className="text-sm leading-snug">
                  Se o email existir na nossa base, você vai receber um link para criar uma nova senha. Confira sua caixa de entrada e a pasta de spam.
                </div>
              </div>
              <p className="text-xs text-white/60">
                O link é válido por 30 minutos.
              </p>
              <Link href="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-[hsl(28,85%,55%)] hover:underline">
                <ArrowLeft className="h-4 w-4" /> Voltar para o login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-3xl font-display font-bold leading-tight tracking-tight text-white">
                Esqueceu a senha?
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/75">
                Tudo bem. Coloque seu email e te enviamos um link pra criar uma nova.
              </p>

              <div className="mt-8">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs uppercase tracking-wider text-white/75 font-semibold">
                            Email cadastrado
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="seu@email.com"
                              autoComplete="email"
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
                      disabled={loading}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      {loading ? "Enviando..." : "Enviar link de recuperação"}
                    </Button>
                  </form>
                </Form>

                <div className="mt-6 text-center">
                  <Link href="/login" className="inline-flex items-center gap-2 text-sm text-white/75 hover:text-white">
                    <ArrowLeft className="h-3.5 w-3.5" /> Voltar para o login
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
