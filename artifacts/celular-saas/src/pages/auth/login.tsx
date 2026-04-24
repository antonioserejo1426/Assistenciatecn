import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { PenTool } from "lucide-react";

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
    defaultValues: {
      email: "",
      senha: "",
    },
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({ data: values }, {
      onSuccess: (data) => {
        setToken(data.token);
        toast.success("Login realizado com sucesso!");
        setLocation("/");
      },
      onError: (error) => {
        toast.error("Erro ao fazer login. Verifique suas credenciais.");
        console.error(error);
      }
    });
  };

  return (
    <div className="flex min-h-screen">
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="flex items-center gap-2 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <PenTool className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight">TecnoFix</span>
          </div>
          
          <h2 className="mt-8 text-2xl font-bold leading-9 tracking-tight text-foreground">
            Acesse sua conta
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Não tem uma conta?{" "}
            <Link href="/registro" className="font-semibold text-primary hover:text-primary/80">
              Teste grátis por 7 dias
            </Link>
          </p>

          <div className="mt-10">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="seu@email.com" {...field} />
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
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                  {loginMutation.isPending ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
      <div className="relative hidden w-0 flex-1 lg:block bg-muted">
        <div className="absolute inset-0 h-full w-full object-cover bg-sidebar flex flex-col items-center justify-center text-white p-12">
          <PenTool className="w-24 h-24 text-primary mb-8 opacity-80" />
          <h2 className="text-4xl font-bold mb-4 text-center">A ferramenta definitiva para sua assistência técnica.</h2>
          <p className="text-xl text-center text-sidebar-foreground/70 max-w-2xl">
            Gerencie ordens de serviço, estoque e PDV em um só lugar. Feito para quem entende de eletrônica.
          </p>
        </div>
      </div>
    </div>
  );
}
