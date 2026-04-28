import { Suspense, lazy } from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { AppLayout } from "@/components/layout";

const Landing = lazy(() => import("@/pages/landing/index"));
const Login = lazy(() => import("@/pages/auth/login"));
const Register = lazy(() => import("@/pages/auth/register"));
const Dashboard = lazy(() => import("@/pages/dashboard/index"));
const PDV = lazy(() => import("@/pages/pdv/index"));
const Scan = lazy(() => import("@/pages/scan/index"));
const Produtos = lazy(() => import("@/pages/produtos/index"));
const Estoque = lazy(() => import("@/pages/estoque/index"));
const Vendas = lazy(() => import("@/pages/vendas/index"));
const Servicos = lazy(() => import("@/pages/servicos/index"));
const Tecnicos = lazy(() => import("@/pages/tecnicos/index"));
const Assinatura = lazy(() => import("@/pages/assinatura/index"));
const AssinaturaSucesso = lazy(() => import("@/pages/assinatura/sucesso"));
const AssinaturaCancelado = lazy(() => import("@/pages/assinatura/cancelado"));
const Configuracoes = lazy(() => import("@/pages/configuracoes/index"));
const Admin = lazy(() => import("@/pages/admin/index"));
const NotFound = lazy(() => import("@/pages/not-found"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});

function PageFallback() {
  return (
    <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
      Carregando...
    </div>
  );
}

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
            <Suspense fallback={<PageFallback />}>
              <Router />
            </Suspense>
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
