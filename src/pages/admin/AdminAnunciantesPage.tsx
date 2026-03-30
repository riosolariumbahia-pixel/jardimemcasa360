import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface AnuncianteForm {
  nome: string;
  tipo: "fornecedor" | "prestador";
  cidade: string;
  descricao: string;
  whatsapp: string;
  plano: "free" | "premium";
  ativo: boolean;
}

const emptyForm: AnuncianteForm = { nome: "", tipo: "fornecedor", cidade: "", descricao: "", whatsapp: "", plano: "free", ativo: true };

export default function AdminAnunciantesPage() {
  const { isAdmin, loading } = useAdminAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<AnuncianteForm>(emptyForm);

  useEffect(() => {
    if (!loading && !isAdmin) navigate("/admin/login", { replace: true });
  }, [isAdmin, loading, navigate]);

  const { data: anunciantes = [], isLoading } = useQuery({
    queryKey: ["admin-anunciantes"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("anunciantes").select("*").order("criado_em", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (f: AnuncianteForm & { id?: string }) => {
      if (f.id) {
        const { error } = await supabase.from("anunciantes").update(f).eq("id", f.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("anunciantes").insert(f);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-anunciantes"] });
      queryClient.invalidateQueries({ queryKey: ["admin-anunciantes-count"] });
      toast.success(editId ? "Anunciante atualizado!" : "Anunciante criado!");
      closeDialog();
    },
    onError: () => toast.error("Erro ao salvar anunciante."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("anunciantes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-anunciantes"] });
      queryClient.invalidateQueries({ queryKey: ["admin-anunciantes-count"] });
      toast.success("Anunciante excluído!");
    },
    onError: () => toast.error("Erro ao excluir."),
  });

  const closeDialog = () => { setOpen(false); setEditId(null); setForm(emptyForm); };

  const openEdit = (a: any) => {
    setEditId(a.id);
    setForm({ nome: a.nome, tipo: a.tipo, cidade: a.cidade, descricao: a.descricao, whatsapp: a.whatsapp, plano: a.plano, ativo: a.ativo });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(editId ? { ...form, id: editId } : form);
  };

  if (loading || !isAdmin) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Carregando...</p></div>;

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild><Link to="/admin/dashboard"><ArrowLeft className="h-4 w-4" /></Link></Button>
            <h1 className="text-xl font-bold text-foreground">Anunciantes</h1>
          </div>
          <Dialog open={open} onOpenChange={(v) => { if (!v) closeDialog(); else { setEditId(null); setForm(emptyForm); setOpen(true); } }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Anunciante</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editId ? "Editar Anunciante" : "Novo Anunciante"}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2"><Label>Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Tipo</Label>
                  <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="fornecedor">Fornecedor</SelectItem><SelectItem value="prestador">Prestador</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Cidade</Label><Input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Descrição</Label><Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} required /></div>
                <div className="space-y-2"><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} required placeholder="5511999999999" /></div>
                <div className="space-y-2"><Label>Plano</Label>
                  <Select value={form.plano} onValueChange={(v) => setForm({ ...form, plano: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="free">Free</SelectItem><SelectItem value="premium">Premium</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2"><Switch checked={form.ativo} onCheckedChange={(v) => setForm({ ...form, ativo: v })} /><Label>Ativo</Label></div>
                <Button type="submit" className="w-full" disabled={saveMutation.isPending}>{saveMutation.isPending ? "Salvando..." : "Salvar"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <p className="p-4 text-muted-foreground">Carregando...</p>
            ) : anunciantes.length === 0 ? (
              <p className="p-4 text-muted-foreground">Nenhum anunciante cadastrado.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Cidade</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Ativo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {anunciantes.map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.nome}</TableCell>
                      <TableCell className="capitalize">{a.tipo}</TableCell>
                      <TableCell>{a.cidade}</TableCell>
                      <TableCell className="capitalize">{a.plano}</TableCell>
                      <TableCell>{a.ativo ? "✅" : "❌"}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { if (confirm("Excluir este anunciante?")) deleteMutation.mutate(a.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
