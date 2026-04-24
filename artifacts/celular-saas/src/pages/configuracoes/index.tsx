import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useGetEmpresa, useUpdateEmpresa, getGetEmpresaQueryKey, getMeQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react";

export default function ConfiguracoesPage() {
  const qc = useQueryClient();
  const { data: empresa } = useGetEmpresa();
  const atualizar = useUpdateEmpresa();
  const [nome, setNome] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (empresa) {
      setNome(empresa.nome);
      setLogoUrl(empresa.logoUrl ?? null);
    }
  }, [empresa]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogoUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function salvar() {
    try {
      await atualizar.mutateAsync({ data: { nome, logoUrl } });
      toast.success("Empresa atualizada");
      qc.invalidateQueries({ queryKey: getGetEmpresaQueryKey() });
      qc.invalidateQueries({ queryKey: getMeQueryKey() });
    } catch {
      toast.error("Erro ao salvar");
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Configurações</h1>
      <Card>
        <CardHeader>
          <CardTitle>Empresa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-1">
            <Label>Nome da empresa</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Logo</Label>
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
                ) : (
                  <span className="text-xs text-muted-foreground">Sem logo</span>
                )}
              </div>
              <label className="cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
                <span className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent">
                  <Upload className="h-4 w-4" /> Trocar logo
                </span>
              </label>
              {logoUrl && (
                <Button variant="ghost" size="sm" onClick={() => setLogoUrl(null)}>
                  Remover
                </Button>
              )}
            </div>
          </div>
          <Button onClick={salvar} disabled={atualizar.isPending}>
            Salvar alterações
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
