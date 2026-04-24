import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  useListTecnicos,
  useCreateTecnico,
  useDeleteTecnico,
  getListTecnicosQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Users } from "lucide-react";

export default function TecnicosPage() {
  const qc = useQueryClient();
  const { data: tecnicos = [] } = useListTecnicos();
  const criar = useCreateTecnico();
  const remover = useDeleteTecnico();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", especialidade: "", telefone: "" });

  async function salvar() {
    try {
      await criar.mutateAsync({
        data: {
          nome: form.nome,
          especialidade: form.especialidade || null,
          telefone: form.telefone || null,
        },
      });
      toast.success("Técnico criado");
      setOpen(false);
      setForm({ nome: "", especialidade: "", telefone: "" });
      qc.invalidateQueries({ queryKey: getListTecnicosQueryKey() });
    } catch {
      toast.error("Erro ao criar técnico");
    }
  }

  async function deletar(id: number) {
    if (!confirm("Remover este técnico?")) return;
    await remover.mutateAsync({ id });
    qc.invalidateQueries({ queryKey: getListTecnicosQueryKey() });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Técnicos</h1>
          <p className="text-sm text-muted-foreground">{tecnicos.length} cadastrados</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Novo técnico
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo técnico</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="grid gap-1">
                <Label>Nome</Label>
                <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              </div>
              <div className="grid gap-1">
                <Label>Especialidade</Label>
                <Input
                  value={form.especialidade}
                  onChange={(e) => setForm({ ...form, especialidade: e.target.value })}
                  placeholder="Ex: Placas, Software, Telas"
                />
              </div>
              <div className="grid gap-1">
                <Label>Telefone</Label>
                <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={salvar} disabled={!form.nome}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardContent className="p-0">
          {tecnicos.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Users className="mx-auto mb-2 h-10 w-10 opacity-40" />
              Nenhum técnico cadastrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Especialidade</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {tecnicos.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.nome}</TableCell>
                    <TableCell>{t.especialidade ?? "—"}</TableCell>
                    <TableCell>{t.telefone ?? "—"}</TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => deletar(t.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
