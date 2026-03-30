import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
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

interface AnuncioForm {
  titulo: string;
  descricao: string;
  anunciante_id: string;
  imagem_url: string;
  link_whatsapp: string;
  ativo: boolean;
}

const emptyForm: AnuncioForm = { titulo: "", descricao: "", anunciante_id: "", imagem_url: "", link_whatsapp: "", ativo: true };

export default function AdminAnunciosPage() {
  const { isAdmin, loading } = useAdminAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<AnuncioForm>(emptyForm);

  useEffect(() => {
    if (!loading && !isAdmin) navigate("/admin/login", { replace: true });
  }, [isAdmin, loading, navigate]);

  const { data: anuncios = [], isLoading } = useQuery({
    queryKey: ["admin-anuncios"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("anuncios").select("*, anunciantes(nome)").order("criado_em", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: anunciantes = [] } = useQuery({
    queryKey: ["admin-anunciantes-dropdown"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("anunciantes").select("id, nome").eq("ativo", true).order("nome");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (f: AnuncioForm & { id?: string }) => {
      const payload: any = { titulo: f.titulo, descricao: f.descricao, anunciante_id: f.anunciante_id, link_whatsapp: f.link_whatsapp, ativo: f.ativo };
      if (f.imagem_url) payload.imagem_url = f.imagem_url;
      if (f.id) {
        const { error } = await supabase.from("anuncios").update(payload).eq("id", f.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("anuncios").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-anuncios"] });
      queryClient.invalidateQueries({ queryKey: ["admin-anuncios-count"] });
      toast.success(editId ? "Anúncio atualizado!" : "Anúncio criado!");
      closeDialog();
    },
    onError: () => toast.error("Erro ao salvar anúncio."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("anuncios").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-anuncios"] });
      queryClient.invalidateQueries({ queryKey: ["admin-anuncios-count"] });
      toast.success("Anúncio excluído!");
    },
    onError: () => toast.error("Erro ao excluir."),
  });

  const closeDialog = () => { setOpen(false); setEditId(null); setForm(emptyForm); };

  const openEdit = (a: any) => {
    setEditId(a.id);
    setForm({ titulo: a.titulo, descricao: a.descricao, anunciante_id: a.anunciante_id, imagem_url: a.imagem_url || "", link_whatsapp: a.link_whatsapp, ativo: a.ativo });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.anunciante_id) { toast.error("Selecione um anunciante."); return; }
    saveMutation.mutate(editId ? { ...form, id: editId } : form);
  };

  if (loading || !isAdmin) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Carregando...</p></div>;

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild><Link to="/admin/dashboard"><ArrowLeft className="h-4 w-4" /></Link></Button>
            <h1 className="text-xl font-bold text-foreground">Anúncios</h1>
          </div>
          <Dialog open={open} onOpenChange={(v) => { if (!v) closeDialog(); else { setEditId(null); setForm(emptyForm); setOpen(true); } }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Anúncio</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editId ? "Editar Anúncio" : "Novo Anúncio"}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2"><Label>Título</Label><Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Descrição</Label><Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Anunciante</Label>
                  <Select value={form.anunciante_id} onValueChange={(v) => setForm({ ...form, anunciante_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {anunciantes.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>URL da Imagem (opcional)</Label><Input value={form.imagem_url} onChange={(e) => setForm({ ...form, imagem_url: e.target.value })} placeholder="https://..." /></div>
                <div className="space-y-2"><Label>Link WhatsApp</Label><Input value={form.link_whatsapp} onChange={(e) => setForm({ ...form, link_whatsapp: e.target.value })} required placeholder="https://wa.me/5511999999999" /></div>
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
            ) : anuncios.length === 0 ? (
              <p className="p-4 text-muted-foreground">Nenhum anúncio cadastrado.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Anunciante</TableHead>
                    <TableHead>Ativo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {anuncios.map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.titulo}</TableCell>
                      <TableCell>{a.anunciantes?.nome ?? "—"}</TableCell>
                      <TableCell>{a.ativo ? "✅" : "❌"}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { if (confirm("Excluir este anúncio?")) deleteMutation.mutate(a.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
