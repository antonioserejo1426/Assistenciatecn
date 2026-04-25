import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ArrowRightLeft,
  PenTool,
  Users,
  Settings,
  CreditCard,
  LogOut,
  ShieldAlert,
  Receipt,
  Crown,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, empresa, assinaturaStatus, hasFeature, logout } = useAuth();
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  const isSuperAdmin = user?.role === "super_admin";
  const empresaBloqueada = !!empresa?.bloqueada || empresa?.ativa === false;
  const blocked =
    !isSuperAdmin && (empresaBloqueada || assinaturaStatus !== "ativa");

  const statusLabel: Record<string, string> = {
    ativa: "Ativa",
    pendente: "Aguardando pagamento",
    vencida: "Vencida",
    cancelada: "Cancelada",
  };

  const statusColor =
    assinaturaStatus === "ativa"
      ? "bg-emerald-400"
      : assinaturaStatus === "pendente"
        ? "bg-[hsl(38,92%,55%)]"
        : "bg-rose-500";

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <Sidebar className="border-r border-sidebar-border sidebar-luxe">
          <SidebarHeader className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-gradient gold-ring">
                <Crown className="h-5 w-5 text-[hsl(222,47%,8%)]" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-[10px] font-semibold tracking-[0.25em] text-[hsl(38,92%,70%)] uppercase">
                  Premium
                </span>
                <span className="text-lg font-display font-bold text-white truncate max-w-[10rem]">
                  {empresa?.nome || "TecnoFix"}
                </span>
              </div>
            </div>
            {assinaturaStatus && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                <span className={`inline-block h-2 w-2 rounded-full ${statusColor} shadow-[0_0_10px_currentColor]`} />
                <span className="text-xs uppercase tracking-wider text-white/80 font-medium">
                  {statusLabel[assinaturaStatus] || assinaturaStatus}
                </span>
              </div>
            )}
          </SidebarHeader>

          <SidebarContent className="px-2">
            <SidebarGroup>
              <SidebarMenu>
                <NavItem href="/" icon={LayoutDashboard} label="Dashboard" active={isActive("/")} />

                {!blocked && (
                  <>
                    <NavItem href="/pdv" icon={ShoppingCart} label="PDV" active={isActive("/pdv")} highlight />
                    <NavItem href="/produtos" icon={Package} label="Produtos" active={isActive("/produtos")} />
                    <NavItem href="/estoque" icon={ArrowRightLeft} label="Estoque" active={isActive("/estoque")} />
                    <NavItem href="/vendas" icon={Receipt} label="Vendas" active={isActive("/vendas")} />
                    {hasFeature("servicos") && (
                      <NavItem href="/servicos" icon={PenTool} label="Serviços" active={isActive("/servicos")} />
                    )}
                    {hasFeature("tecnicos") && (
                      <NavItem href="/tecnicos" icon={Users} label="Técnicos" active={isActive("/tecnicos")} />
                    )}
                  </>
                )}

                <div className="my-3 mx-2 gold-divider opacity-60" />

                <NavItem
                  href="/configuracoes"
                  icon={Settings}
                  label="Configurações"
                  active={isActive("/configuracoes")}
                />
                <NavItem href="/assinatura" icon={CreditCard} label="Assinatura" active={isActive("/assinatura")} />

                {user?.role === "super_admin" && (
                  <NavItem href="/admin" icon={ShieldAlert} label="Admin Master" active={isActive("/admin")} />
                )}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-4">
            <div className="rounded-xl bg-white/5 border border-white/10 p-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-gradient text-[hsl(222,47%,8%)] font-bold">
                  {(user?.nome || "U").trim().charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-semibold truncate text-white">{user?.nome}</p>
                  <p className="text-xs text-white/60 truncate">{user?.email}</p>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-white/90 border-white/15 bg-white/5 hover:bg-white/10 hover:text-white"
              onClick={logout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 overflow-y-auto bg-background">
          <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border/60 bg-background/85 px-4 py-3 backdrop-blur lg:px-8">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-foreground" />
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-gradient">
                  <Crown className="h-4 w-4 text-[hsl(222,47%,8%)]" />
                </div>
                <span className="text-sm font-display font-bold tracking-tight truncate max-w-[10rem] sm:max-w-none">
                  {empresa?.nome || "TecnoFix"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col items-end leading-tight">
                <span className="text-xs font-semibold truncate max-w-[12rem]">{user?.nome}</span>
                <span className="text-[10px] text-muted-foreground truncate max-w-[12rem]">{user?.email}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                onClick={logout}
              >
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </header>

          {blocked && !location.startsWith("/assinatura") ? (
            <div className="flex h-full items-center justify-center p-6">
              <div className="card-luxe card-luxe-elevated max-w-md text-center p-10">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                  <ShieldAlert className="h-7 w-7" />
                </div>
                <h2 className="font-display text-2xl font-bold mb-2">Assinatura Inativa</h2>
                <p className="text-muted-foreground mb-6">
                  Sua assinatura está {assinaturaStatus}. Para continuar usando o TecnoFix, por favor reative sua
                  assinatura.
                </p>
                <Button asChild size="lg" className="btn-luxe rounded-xl">
                  <Link href="/assinatura">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Gerenciar Assinatura
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-6 lg:p-8">{children}</div>
          )}
        </main>
      </div>
    </SidebarProvider>
  );
}

function NavItem({
  href,
  icon: Icon,
  label,
  active,
  highlight,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  highlight?: boolean;
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={active}
        className={
          active
            ? "rounded-lg bg-white/[0.07] text-white border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:bg-white/10"
            : "rounded-lg text-white/70 hover:text-white hover:bg-white/5"
        }
      >
        <Link href={href}>
          <Icon
            className={`h-4 w-4 ${
              active ? "text-[hsl(38,92%,60%)]" : highlight ? "text-[hsl(38,92%,60%)]" : "text-white/50"
            }`}
          />
          <span className="font-medium tracking-wide">{label}</span>
          {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[hsl(38,92%,55%)] shadow-[0_0_10px_currentColor]" />}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
