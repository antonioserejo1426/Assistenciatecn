import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Sidebar, SidebarContent, SidebarGroup, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarHeader, SidebarFooter, SidebarProvider } from "@/components/ui/sidebar";
import { LayoutDashboard, ShoppingCart, Package, ArrowRightLeft, PenTool, Users, Settings, CreditCard, LogOut, ShieldAlert, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, empresa, assinaturaStatus, logout } = useAuth();
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  const isSuperAdmin = user?.role === 'super_admin';
  const blocked = !isSuperAdmin && assinaturaStatus !== 'ativa' && assinaturaStatus !== 'trial';

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <Sidebar className="border-r border-sidebar-border">
          <SidebarHeader className="p-4 bg-sidebar text-sidebar-foreground">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
                TF
              </div>
              <div className="flex flex-col">
                <span className="font-bold leading-none">{empresa?.nome || "TecnoFix"}</span>
                {assinaturaStatus && (
                  <span className="text-xs text-sidebar-foreground/70 uppercase tracking-wider">{assinaturaStatus}</span>
                )}
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="bg-sidebar">
            <SidebarGroup>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/")}>
                    <Link href="/">
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                {!blocked && (
                  <>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={isActive("/pdv")}>
                        <Link href="/pdv">
                          <ShoppingCart className="w-4 h-4" />
                          <span>PDV</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={isActive("/produtos")}>
                        <Link href="/produtos">
                          <Package className="w-4 h-4" />
                          <span>Produtos</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={isActive("/estoque")}>
                        <Link href="/estoque">
                          <ArrowRightLeft className="w-4 h-4" />
                          <span>Estoque</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={isActive("/vendas")}>
                        <Link href="/vendas">
                          <Receipt className="w-4 h-4" />
                          <span>Vendas</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={isActive("/servicos")}>
                        <Link href="/servicos">
                          <PenTool className="w-4 h-4" />
                          <span>Serviços</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={isActive("/tecnicos")}>
                        <Link href="/tecnicos">
                          <Users className="w-4 h-4" />
                          <span>Técnicos</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </>
                )}

                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/configuracoes")}>
                    <Link href="/configuracoes">
                      <Settings className="w-4 h-4" />
                      <span>Configurações</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/assinatura")}>
                    <Link href="/assinatura">
                      <CreditCard className="w-4 h-4" />
                      <span>Assinatura</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {user?.role === 'super_admin' && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/admin")}>
                      <Link href="/admin">
                        <ShieldAlert className="w-4 h-4" />
                        <span>Admin</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          
          <SidebarFooter className="p-4 bg-sidebar">
            <div className="flex items-center gap-2 mb-4 text-sidebar-foreground">
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">{user?.nome}</p>
                <p className="text-xs text-sidebar-foreground/70 truncate">{user?.email}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full justify-start text-sidebar-foreground border-sidebar-border hover:bg-sidebar-accent" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </SidebarFooter>
        </Sidebar>
        
        <main className="flex-1 overflow-y-auto bg-background">
          {blocked && !location.startsWith('/assinatura') ? (
            <div className="flex h-full items-center justify-center p-6">
              <div className="max-w-md text-center">
                <ShieldAlert className="mx-auto h-12 w-12 text-destructive mb-4" />
                <h2 className="text-2xl font-bold mb-2">Assinatura Inativa</h2>
                <p className="text-muted-foreground mb-6">
                  Sua assinatura está {assinaturaStatus}. Para continuar usando o TecnoFix, por favor reative sua assinatura.
                </p>
                <Button asChild size="lg">
                  <Link href="/assinatura">Gerenciar Assinatura</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-full p-6 lg:p-8">
              {children}
            </div>
          )}
        </main>
      </div>
    </SidebarProvider>
  );
}
