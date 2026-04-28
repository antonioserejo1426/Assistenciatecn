import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  useAdminResumo,
  useAdminListEmpresas,
  useAdminToggleBloqueioEmpresa,
  useAdminAtivarAssinatura,
  useAdminListUsuariosEmpresa,
  useAdminUpdateUsuario,
  useAdminDeleteUsuario,
  useAdminToggleBloqueioUsuario,
  useAdminUpdatePlano,
  useListPlanos,
  getAdminListEmpresasQueryKey,
  getAdminResumoQueryKey,
  getAdminListUsuariosEmpresaQueryKey,
  getListPlanosQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Lock, Unlock, Sparkles, Building2, AlertTriangle, DollarSign, KeyRound, UserCog, Trash2, Database, Download, RefreshCw } from "lucide-react";
import { formatBRL, formatBytes, formatDateTime } from "@/lib/utils";
import {
  listBackups,
  triggerBackup,
  deleteBackup as apiDeleteBackup,
  backupDownloadUrl,
  type BackupFileDto,
} from "@/lib/admin-api";
import { useQuery, useMutation } from "@tanstack/react-query";

const fmt = formatBRL;

export default function AdminPage() {
  const qc = useQueryClient();
  const { data: resumo } = useAdminResumo();
  const { data: empresas = [] } = useAdminListEmpresas();
  const { data: planos = [] } = useListPlanos();
  const toggle = useAdminToggleBloqueioEmpresa();
  const ativar = useAdminAtivarAssinatura();

  const [ativarDialog, setAtivarDialog] = useState<number | null>(null);
  const [ativarPlanoId, setAtivarPlanoId] = useState("");
  const [ativarDias, setAtivarDias] = useState("30");
  const [usuariosDialog, setUsuariosDialog] = useState<{ id: number; nome: string } | null>(null);
  const [editUsuario, setEditUsuario] = useState<any | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editSenha, setEditSenha] = useState("");

  const toggleUsuario = useAdminToggleBloqueioUsuario();
  const updateUsuario = useAdminUpdateUsuario();
  const deleteUsuario = useAdminDeleteUsuario();
  const updatePlano = useAdminUpdatePlano();
  const { data: usuariosEmpresa = [], isFetching: loadingUsuarios } = useAdminListUsuariosEmpresa(
    usuariosDialog?.id ?? 0,
    {
      query: {
        queryKey: getAdminListUsuariosEmpresaQueryKey(usuariosDialog?.id ?? 0),
        enabled: !!usuariosDialog,
      },
    },
  );

  const [editPlano, setEditPlano] = useState<any | null>(null);
  const [planoNome, setPlanoNome] = useState("");
  const [planoPreco, setPlanoPreco] = useState("");
  const [planoDescricao, setPlanoDescricao] = useState("");

  function refresh() {
    qc.invalidateQueries({ queryKey: getAdminListEmpresasQueryKey() });
    qc.invalidateQueries({ queryKey: getAdminResumoQueryKey() });
  }

  async function bloquear(id: number, bloqueada: boolean) {
    await toggle.mutateAsync({ id, data: { bloqueada } });
    toast.success(bloqueada ? "Empresa bloqueada" : "Empresa desbloqueada");
    refresh();
  }

  async function aplicarAtivar() {
    if (!ativarDialog || !ativarPlanoId) return;
    await ativar.mutateAsync({
      id: ativarDialog,
      data: { planoId: Number(ativarPlanoId), dias: Number(ativarDias) },
    });
    toast.success("Assinatura ativada");
    setAtivarDialog(null);
    refresh();
  }

  function refreshUsuarios() {
    if (usuariosDialog) {
      qc.invalidateQueries({ queryKey: getAdminListUsuariosEmpresaQueryKey(usuariosDialog.id) });
    }
  }

  async function bloquearUsuario(id: number, ativo: boolean) {
    await toggleUsuario.mutateAsync({ id, data: { bloqueada: ativo } });
    toast.success(ativo ? "Usuário bloqueado" : "Usuário desbloqueado");
    refreshUsuarios();
  }

  function abrirEdicao(u: any) {
    setEditUsuario(u);
    setEditNome(u.nome ?? "");
    setEditEmail(u.email ?? "");
    setEditSenha("");
  }

  async function excluirUsuario(u: any) {
    if (!confirm(`Excluir o usuário "${u.nome}" (${u.email})? Esta ação não pode ser desfeita.`)) return;
    try {
      await deleteUsuario.mutateAsync({ id: u.id });
      toast.success("Usuário excluído");
      refreshUsuarios();
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao excluir usuário");
    }
  }

  function abrirEdicaoPlano(p: any) {
    setEditPlano(p);
    setPlanoNome(p.nome ?? "");
    setPlanoPreco(String(p.preco ?? ""));
    setPlanoDescricao(p.descricao ?? "");
  }

  async function salvarPlano() {
    if (!editPlano) return;
    const preco = Number(planoPreco.replace(",", "."));
    if (Number.isNaN(preco) || preco < 0) {
      toast.error("Preço inválido");
      return;
    }
    try {
      await updatePlano.mutateAsync({
        id: editPlano.id,
        data: {
          nome: planoNome.trim() || editPlano.nome,
          preco,
          descricao: planoDescricao.trim() ? planoDescricao.trim() : null,
        },
      });
      toast.success("Plano atualizado");
      setEditPlano(null);
      qc.invalidateQueries({ queryKey: getListPlanosQueryKey() });
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao atualizar plano");
    }
  }

  async function salvarEdicao() {
    if (!editUsuario) return;
    const data: Record<string, unknown> = {};
    if (editNome.trim() && editNome.trim() !== editUsuario.nome) data["nome"] = editNome.trim();
    if (editEmail.trim() && editEmail.trim().toLowerCase() !== editUsuario.email) {
      data["email"] = editEmail.trim().toLowerCase();
    }
    if (editSenha.trim()) {
      if (editSenha.length < 4) {
        toast.error("Senha deve ter no mínimo 4 caracteres");
        return;
      }
      data["senha"] = editSenha;
    }
    if (Object.keys(data).length === 0) {
      toast.info("Nenhuma alteração");
      return;
    }
    try {
      await updateUsuario.mutateAsync({ id: editUsuario.id, data });
      toast.success("Usuário atualizado");
      setEditUsuario(null);
      refreshUsuarios();
    } catch (err: any) {
      const msg = err?.message ?? "Erro ao atualizar usuário";
      toast.error(msg);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Master</h1>
        <p className="text-sm text-muted-foreground">Gestão de todas as empresas TecnoFix</p>
      </div>

      <BackupsCard />


      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Building2 className="h-3 w-3" /> Empresas</div>
            <div className="text-2xl font-bold">{resumo?.empresas ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Sparkles className="h-3 w-3" /> Ativas</div>
            <div className="text-2xl font-bold text-emerald-600">{resumo?.ativas ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><AlertTriangle className="h-3 w-3" /> Vencidas</div>
            <div className="text-2xl font-bold text-destructive">{resumo?.vencidas ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><DollarSign className="h-3 w-3" /> MRR</div>
            <div className="text-2xl font-bold">{fmt(resumo?.mrr ?? 0)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Planos & Preços</CardTitle>
          <p className="text-sm text-muted-foreground">
            Edite o valor dos planos. O Stripe sincroniza o novo preço para os próximos pagamentos.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plano</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Preço (mês)</TableHead>
                <TableHead className="w-[160px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {planos.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.nome}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-md truncate">
                    {p.descricao ?? "—"}
                  </TableCell>
                  <TableCell className="font-semibold">{fmt(p.preco)}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => abrirEdicaoPlano(p)}>
                      <KeyRound className="mr-1 h-3 w-3" /> Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Empresas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="w-[280px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {empresas.map((e: any) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <div className="font-medium">{e.nome}</div>
                    <div className="text-xs text-muted-foreground">#{e.id}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {e.bloqueada && <Badge variant="destructive">Bloqueada</Badge>}
                      {e.status && <Badge variant="outline" className="capitalize">{e.status}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>{e.planoNome ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {e.proximoVencimento ? formatDateTime(e.proximoVencimento) : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Button size="sm" variant="outline" onClick={() => bloquear(e.id, !e.bloqueada)}>
                        {e.bloqueada ? <Unlock className="mr-1 h-3 w-3" /> : <Lock className="mr-1 h-3 w-3" />}
                        {e.bloqueada ? "Desbloquear" : "Bloquear"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setAtivarDialog(e.id); setAtivarPlanoId(""); setAtivarDias("30"); }}>
                        <Sparkles className="mr-1 h-3 w-3" /> Ativar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setUsuariosDialog({ id: e.id, nome: e.nome })}>
                        <UserCog className="mr-1 h-3 w-3" /> Usuários
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!ativarDialog} onOpenChange={(o) => !o && setAtivarDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ativar assinatura manual</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div>
              <Label>Plano</Label>
              <Select value={ativarPlanoId} onValueChange={setAtivarPlanoId}>
                <SelectTrigger><SelectValue placeholder="Escolha um plano" /></SelectTrigger>
                <SelectContent>
                  {planos.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.nome} — {fmt(p.preco)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Dias de validade</Label>
              <Input type="number" value={ativarDias} onChange={(e) => setAtivarDias(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAtivarDialog(null)}>Cancelar</Button>
            <Button onClick={aplicarAtivar} disabled={!ativarPlanoId}>Ativar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!usuariosDialog} onOpenChange={(o) => !o && setUsuariosDialog(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Usuários — {usuariosDialog?.nome}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            {loadingUsuarios ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : usuariosEmpresa.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum usuário cadastrado nessa empresa.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[230px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuariosEmpresa.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.nome}</TableCell>
                      <TableCell className="text-sm">{u.email}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{u.role}</Badge></TableCell>
                      <TableCell>
                        {u.ativo ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Ativo</Badge>
                        ) : (
                          <Badge variant="destructive">Bloqueado</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Button size="sm" variant="outline" onClick={() => abrirEdicao(u)}>
                            <KeyRound className="mr-1 h-3 w-3" /> Editar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => bloquearUsuario(u.id, u.ativo)}>
                            {u.ativo ? <Lock className="mr-1 h-3 w-3" /> : <Unlock className="mr-1 h-3 w-3" />}
                            {u.ativo ? "Bloquear" : "Ativar"}
                          </Button>
                          {u.role !== "super_admin" && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => excluirUsuario(u)}
                              disabled={deleteUsuario.isPending}
                            >
                              <Trash2 className="mr-1 h-3 w-3" /> Excluir
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUsuariosDialog(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editUsuario} onOpenChange={(o) => !o && setEditUsuario(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuário</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div>
              <Label>Nome</Label>
              <Input value={editNome} onChange={(e) => setEditNome(e.target.value)} />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
            </div>
            <div>
              <Label>Nova senha</Label>
              <Input
                type="password"
                placeholder="Deixe em branco para não alterar"
                value={editSenha}
                onChange={(e) => setEditSenha(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">Mínimo 4 caracteres</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUsuario(null)}>Cancelar</Button>
            <Button onClick={salvarEdicao} disabled={updateUsuario.isPending}>
              {updateUsuario.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editPlano} onOpenChange={(o) => !o && setEditPlano(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar plano</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div>
              <Label>Nome do plano</Label>
              <Input value={planoNome} onChange={(e) => setPlanoNome(e.target.value)} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Input value={planoDescricao} onChange={(e) => setPlanoDescricao(e.target.value)} />
            </div>
            <div>
              <Label>Preço mensal (BRL)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={planoPreco}
                onChange={(e) => setPlanoPreco(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Ao salvar, um novo preço é criado no Stripe e o anterior é desativado. Assinantes
                já existentes continuam com o preço antigo até a próxima cobrança/renovação.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPlano(null)}>Cancelar</Button>
            <Button onClick={salvarPlano} disabled={updatePlano.isPending}>
              {updatePlano.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BackupsCard() {
  const { data: backups = [], refetch, isFetching } = useQuery<BackupFileDto[]>({
    queryKey: ["admin", "backups"],
    queryFn: listBackups,
    staleTime: 30_000,
  });

  const trigger = useMutation({
    mutationFn: triggerBackup,
    onSuccess: () => {
      toast.success("Backup gerado com sucesso");
      refetch();
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Falha ao gerar backup");
    },
  });

  const remover = useMutation({
    mutationFn: (filename: string) => apiDeleteBackup(filename),
    onSuccess: () => {
      toast.success("Backup removido");
      refetch();
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Falha ao remover backup");
    },
  });

  function baixar(filename: string) {
    const token = localStorage.getItem("tecnofix_token");
    fetch(backupDownloadUrl(filename), {
      headers: token ? { authorization: `Bearer ${token}` } : {},
    })
      .then((r) => {
        if (!r.ok) throw new Error("Falha ao baixar");
        return r.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      })
      .catch((e) => toast.error(e?.message ?? "Erro ao baixar"));
  }

  function confirmarRemover(filename: string) {
    if (!confirm(`Excluir o backup "${filename}"? Esta ação não pode ser desfeita.`)) return;
    remover.mutate(filename);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-4 w-4" /> Backups automáticos do banco
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Backup diário (03:00 UTC), retém os últimos 14. Você também pode gerar manualmente.
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`mr-1 h-3 w-3 ${isFetching ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            <Button size="sm" onClick={() => trigger.mutate()} disabled={trigger.isPending}>
              <Database className="mr-1 h-3 w-3" />
              {trigger.isPending ? "Gerando..." : "Gerar agora"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {backups.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Nenhum backup ainda. Clique em "Gerar agora" para criar o primeiro.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Arquivo</TableHead>
                <TableHead>Tamanho</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="w-[200px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backups.map((b) => (
                <TableRow key={b.filename}>
                  <TableCell className="font-mono text-xs">{b.filename}</TableCell>
                  <TableCell>{formatBytes(b.size)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(b.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => baixar(b.filename)}>
                        <Download className="mr-1 h-3 w-3" /> Baixar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => confirmarRemover(b.filename)}
                        disabled={remover.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
