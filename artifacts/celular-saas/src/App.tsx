import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { AppLayout } from "@/components/layout";

// Pages
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing/index";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import Dashboard from "@/pages/dashboard/index";
import PDV from "@/pages/pdv/index";
import Scan from "@/pages/scan/index";
import Produtos from "@/pages/produtos/index";
import Estoque from "@/pages/estoque/index";
import Vendas from "@/pages/vendas/index";
import Servicos from "@/pages/servicos/index";
import Tecnicos from "@/pages/tecnicos/index";
import Assinatura from "@/pages/assinatura/index";
import AssinaturaSucesso from "@/pages/assinatura/sucesso";
import AssinaturaCancelado from "@/pages/assinatura/cancelado";
import Configuracoes from "@/pages/configuracoes/index";
import Admin from "@/pages/admin/index";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, adminOnly = false, publicFallback: PublicFallback, ...rest }: any) {
  const { token, isLoading, user, empresa, assinaturaStatus } = useAuth();

  if (isLoading) return <div className="flex h-screen items-center justify-center">Carregando...</div>;

  if (!token || !user) {
    if (PublicFallback) return <PublicFallback />;
    return <Redirect to="/login" />;
  }

  if (adminOnly && user.role !== "super_admin") {
    return <Redirect to="/" />;
  }

  const isSuperAdmin = user.role === "super_admin";
  const empresaBloqueada = !!empresa?.bloqueada || empresa?.ativa === false;
  const semAssinaturaValida = assinaturaStatus !== "ativa";
  const liberadoNaRota = rest.path === "/assinatura" || rest.path === "/configuracoes";

  if (!isSuperAdmin && empresaBloqueada) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
          <h2 className="text-2xl font-bold text-destructive">Conta Bloqueada</h2>
          <p>Sua empresa foi bloqueada pelo administrador do sistema. Entre em contato com o suporte para regularizar.</p>
        </div>
      </AppLayout>
    );
  }

  if (!isSuperAdmin && semAssinaturaValida && !liberadoNaRota) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
          <h2 className="text-2xl font-bold">Assinatura necessária</h2>
          <p>Para usar o TecnoFix é preciso ter uma assinatura ativa. Escolha um plano e finalize o pagamento para liberar o acesso.</p>
          <a href="/assinatura" className="px-4 py-2 bg-primary text-primary-foreground rounded-md">Ver planos e assinar</a>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Component {...rest} />
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/registro" component={Register} />
      <Route path="/scan/:sessaoId" component={Scan} />
      <Route path="/assinatura/sucesso" component={AssinaturaSucesso} />
      <Route path="/assinatura/cancelado" component={AssinaturaCancelado} />
      
      <Route path="/">{(params) => <ProtectedRoute component={Dashboard} publicFallback={Landing} path="/" {...params} />}</Route>
      <Route path="/pdv">{(params) => <ProtectedRoute component={PDV} path="/pdv" {...params} />}</Route>
      <Route path="/produtos">{(params) => <ProtectedRoute component={Produtos} path="/produtos" {...params} />}</Route>
      <Route path="/estoque">{(params) => <ProtectedRoute component={Estoque} path="/estoque" {...params} />}</Route>
      <Route path="/vendas">{(params) => <ProtectedRoute component={Vendas} path="/vendas" {...params} />}</Route>
      <Route path="/servicos">{(params) => <ProtectedRoute component={Servicos} path="/servicos" {...params} />}</Route>
      <Route path="/tecnicos">{(params) => <ProtectedRoute component={Tecnicos} path="/tecnicos" {...params} />}</Route>
      <Route path="/assinatura">{(params) => <ProtectedRoute component={Assinatura} path="/assinatura" {...params} />}</Route>
      <Route path="/configuracoes">{(params) => <ProtectedRoute component={Configuracoes} path="/configuracoes" {...params} />}</Route>
      <Route path="/admin">{(params) => <ProtectedRoute component={Admin} path="/admin" adminOnly={true} {...params} />}</Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
