import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Megaphone, LogOut } from "lucide-react";

export default function AdminDashboardPage() {
  const { isAdmin, loading, user } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAdmin) navigate("/admin/login", { replace: true });
  }, [isAdmin, loading, navigate]);

  const { data: anunciantesCount } = useQuery({
    queryKey: ["admin-anunciantes-count"],
    enabled: isAdmin,
    queryFn: async () => {
      const { count } = await supabase.from("anunciantes").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: anunciosCount } = useQuery({
    queryKey: ["admin-anuncios-count"],
    enabled: isAdmin,
    queryFn: async () => {
      const { count } = await supabase.from("anuncios").select("*", { count: "exact", head: true }).eq("ativo", true);
      return count ?? 0;
    },
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login", { replace: true });
  };

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Painel Administrativo</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-1" /> Sair
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Anunciantes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{anunciantesCount ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Anúncios Ativos</CardTitle>
              <Megaphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{anunciosCount ?? 0}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button asChild size="lg" className="h-16">
            <Link to="/admin/anunciantes">
              <Users className="h-5 w-5 mr-2" /> Gerenciar Anunciantes
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary" className="h-16">
            <Link to="/admin/anuncios">
              <Megaphone className="h-5 w-5 mr-2" /> Gerenciar Anúncios
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
