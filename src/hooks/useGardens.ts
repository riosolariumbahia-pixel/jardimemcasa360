import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface GardenDB {
  id: string;
  name: string;
  location: string | null;
  garden_type: string | null;
  light: string | null;
  wall_height: number | null;
  wall_width: number | null;
  containers: any;
  created_at: string;
}

export function useGardens() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["gardens", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gardens")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as GardenDB[];
    },
    enabled: !!user,
  });

  const addGarden = useMutation({
    mutationFn: async (garden: Omit<GardenDB, "id" | "created_at"> & { user_id?: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("gardens").insert({
        user_id: user.id,
        name: garden.name,
        location: garden.location,
        garden_type: garden.garden_type,
        light: garden.light,
        wall_height: garden.wall_height,
        wall_width: garden.wall_width,
        containers: garden.containers,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["gardens"] }),
  });

  const updateGarden = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from("gardens").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["gardens"] }),
  });

  const removeGarden = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gardens").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["gardens"] }),
  });

  return { gardens: query.data ?? [], isLoading: query.isLoading, addGarden, updateGarden, removeGarden };
}
