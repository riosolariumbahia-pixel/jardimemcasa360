import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { TablesUpdate } from "@/integrations/supabase/types";
import type { Plant } from "@/pages/CatalogPage";

export interface GardenPlantDB {
  id: string;
  name: string;
  emoji: string | null;
  category: string | null;
  health: number | null;
  last_watered: string | null;
  last_fertilized: string | null;
  last_pruned: string | null;
  needs_water: boolean | null;
  needs_fertilizer: boolean | null;
  needs_pruning: boolean | null;
  fertilizer_frequency: string | null;
  fertilizer_amount: string | null;
  water_frequency: string | null;
  light: string | null;
  difficulty: string | null;
  garden_id: string | null;
  created_at: string;
}

export function useGardenPlants() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["garden-plants", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("garden_plants")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as GardenPlantDB[];
    },
    enabled: !!user,
  });

  const addPlant = useMutation({
    mutationFn: async (plant: Plant) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("garden_plants").insert({
        user_id: user.id,
        name: plant.name,
        emoji: plant.emoji,
        category: plant.category,
        fertilizer_frequency: plant.fertilizerFrequency,
        fertilizer_amount: plant.fertilizerAmount,
        water_frequency: plant.water,
        light: plant.light,
        difficulty: plant.difficulty,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["garden-plants"] }),
  });

  const updatePlant = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TablesUpdate<"garden_plants"> }) => {
      const { error } = await supabase
        .from("garden_plants")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["garden-plants"] }),
  });

  const removePlant = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("garden_plants").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["garden-plants"] }),
  });

  return { plants: query.data ?? [], isLoading: query.isLoading, addPlant, updatePlant, removePlant };
}
