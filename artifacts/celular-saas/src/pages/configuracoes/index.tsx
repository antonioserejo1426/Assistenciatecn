import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  useGetEmpresa,
  useUpdateEmpresa,
  getGetEmpresaQueryKey,
  getMeQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, ImageIcon, Crown, Sparkles, Building2, ShieldAlert } from "lucide-react";

const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2 MB
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];

export default function ConfiguracoesPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const { data: empresa, isLoading } = useGetEmpresa({
    query: { enabled: !isSuperAdmin, retry: false },
  });
  const atualizar = useUpdateEmpresa();

  const [nome, setNome] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (empresa) {
      setNome(empresa.nome);
      setLogoUrl(empresa.logoUrl ?? null);
    }
  }, [empresa]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Formato não aceito. Use PNG, JPG, WEBP ou SVG.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      toast.error(`Arquivo muito grande. Máximo de ${(MAX_LOGO_BYTES / 1024 / 1024).toFixed(0)} MB.`);
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setLogoUrl(reader.result as string);
      toast.success("Logo carregada — clique em salvar para confirmar.");
    };
    reader.onerror = () => toast.error("Não foi possível ler o arquivo.");
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function salvar() {
    if (!nome.trim()) {
      toast.error("Informe o nome da empresa.");
      return;
    }
    try {
      await atualizar.mutateAsync({ data: { nome: nome.trim(), logoUrl } });
      toast.success("Configurações salvas com sucesso.");
      qc.invalidateQueries({ queryKey: getGetEmpresaQueryKey() });
      qc.invalidateQueries({ queryKey: getMeQueryKey() });
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar. Tente novamente.");
    }
  }

  if (isSuperAdmin) {
    return (
      <div className="max-w-3xl mx-auto">
        <Header />
        <div className="card-luxe card-luxe-elevated p-10 text-center mt-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[hsl(38,92%,92%)] to-[hsl(38,92%,82%)] text-[hsl(28,85%,38%)] ring-1 ring-[hsl(38,92%,55%)]/25">
            <Crown className="h-7 w-7" />
          </div>
          <h2 className="font-display text-2xl font-bold mb-2">Conta Super Admin</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            A conta master não pertence a uma empresa. Acesse o painel de administração para gerenciar empresas,
            usuários e planos do sistema.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <Header />
        <div className="card-luxe p-8 mt-8 flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-gold-gradient animate-pulse" />
          <span className="text-muted-foreground">Carregando...</span>
        </div>
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="max-w-3xl mx-auto">
        <Header />
        <div className="card-luxe p-8 mt-8 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-destructive mb-3" />
          <p className="font-medium">Não foi possível carregar a empresa.</p>
          <p className="text-sm text-muted-foreground mt-1">Faça login novamente.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Header />

      <div className="card-luxe card-luxe-elevated overflow-hidden">
        <div className="p-7 lg:p-9 space-y-8">
          <section>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(38,92%,92%)] to-[hsl(38,92%,82%)] text-[hsl(28,85%,38%)] ring-1 ring-[hsl(38,92%,55%)]/25">
                <Building2 className="h-4.5 w-4.5" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold leading-tight">Identidade da empresa</h2>
                <p className="text-sm text-muted-foreground">Como sua marca aparece no sistema.</p>
              </div>
            </div>

            <div className="grid gap-2 max-w-md">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Nome da empresa
              </Label>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Sua Assistência Celular"
                className="h-11 rounded-xl bg-card/60 border-input/80 focus-visible:ring-2 focus-visible:ring-[hsl(38,92%,55%)]"
              />
            </div>
          </section>

          <div className="gold-divider" />

          <section>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(38,92%,92%)] to-[hsl(38,92%,82%)] text-[hsl(28,85%,38%)] ring-1 ring-[hsl(38,92%,55%)]/25">
                <ImageIcon className="h-4.5 w-4.5" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold leading-tight">Logotipo</h2>
                <p className="text-sm text-muted-foreground">
                  PNG, JPG, WEBP ou SVG. Tamanho máximo de 2 MB.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-card-border bg-gradient-to-br from-[hsl(36,33%,98%)] to-[hsl(36,30%,94%)] gold-ring">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-full w-full object-contain p-2" />
                ) : (
                  <div className="flex flex-col items-center text-muted-foreground">
                    <ImageIcon className="h-7 w-7 opacity-40" />
                    <span className="text-[10px] mt-1 uppercase tracking-wider">sem logo</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={handleFile}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl h-11 px-5 border-foreground/15 hover:bg-foreground/5"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {logoUrl ? "Trocar logo" : "Enviar logo"}
                </Button>
                {logoUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="rounded-xl h-11 text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      setLogoUrl(null);
                      toast("Logo removida — salve para confirmar.");
                    }}
                  >
                    Remover
                  </Button>
                )}
              </div>
            </div>
          </section>
        </div>

        <div className="border-t border-card-border bg-gradient-to-b from-transparent to-[hsl(36,25%,97%)] p-6 flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">As alterações são aplicadas imediatamente em todo o sistema.</p>
          <Button
            onClick={salvar}
            disabled={atualizar.isPending}
            className="btn-luxe rounded-xl h-11 px-6 font-semibold"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {atualizar.isPending ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div>
      <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(38,92%,55%)]/30 bg-[hsl(38,92%,55%)]/10 px-3 py-1 text-xs font-medium text-[hsl(28,85%,38%)]">
        <Sparkles className="h-3.5 w-3.5" />
        Configurações Premium
      </div>
      <h1 className="mt-3 font-display text-4xl font-bold tracking-tight">Configurações</h1>
      <p className="text-muted-foreground mt-1">Personalize sua marca e identidade no TecnoFix.</p>
    </div>
  );
}
