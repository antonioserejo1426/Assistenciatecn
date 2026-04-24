import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { PenTool } from "lucide-react";

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
  
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      empresaNome: "",
      nome: "",
      email: "",
      senha: "",
    },
  });

  const onSubmit = (values: z.infer<typeof registerSchema>) => {
    registerMutation.mutate({ data: values }, {
      onSuccess: (data) => {
        setToken(data.token);
        toast.success("Conta criada com sucesso! Aproveite seus 7 dias de teste.");
        setLocation("/");
      },
      onError: (error) => {
        toast.error("Erro ao criar conta. Verifique os dados e tente novamente.");
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
            Crie sua conta
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Já tem uma conta?{" "}
            <Link href="/login" className="font-semibold text-primary hover:text-primary/80">
              Faça login
            </Link>
          </p>

          <div className="mt-10">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="empresaNome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Assistência</FormLabel>
                      <FormControl>
                        <Input placeholder="Sua Assistência Celular" {...field} />
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
                      <FormLabel>Seu Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="João Silva" {...field} />
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

                <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                  {registerMutation.isPending ? "Criando conta..." : "Começar Teste Grátis"}
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
