// Sistema de cálculo dinâmico de saúde das plantas
// Avalia o estado real com base em quanto tempo se passou desde a última rega/adubação
// versus a frequência ideal de cada espécie.

import type { GardenPlantDB } from "@/hooks/useGardenPlants";

export interface PlantStatus {
  health: number; // 0-100 calculado dinamicamente
  needsWater: boolean;
  needsFertilizer: boolean;
  needsPruning: boolean;
  waterStatus: "ok" | "atrasado" | "critico";
  fertilizerStatus: "ok" | "atrasado" | "critico";
  daysSinceWater: number | null;
  daysSinceFertilizer: number | null;
  waterDueInDays: number; // dias restantes (negativo = atrasado)
  fertilizerDueInDays: number;
  alertLevel: "saudavel" | "atencao" | "critico";
  alertMessage: string;
}

// Converte a frequência de rega textual em dias ideais entre regas
export function getWateringIntervalDays(waterFreq: string | null | undefined): number {
  if (!waterFreq) return 4;
  const f = waterFreq.toLowerCase();
  if (f.includes("frequente")) return 2;        // Samambaia, Avenca, Impatiens
  if (f.includes("regular")) return 4;          // maioria das flores e folhagens
  if (f.includes("moderada")) return 6;         // Violeta, Peperômia, Cravina
  if (f.includes("pouca")) return 10;           // Suculentas, Espada, Zamioculca
  return 4;
}

// Converte a frequência de adubação textual em dias ideais
export function getFertilizerIntervalDays(freq: string | null | undefined): number {
  if (!freq) return 20;
  const match = freq.match(/(\d+)\s*dias/i);
  if (match) return parseInt(match[1], 10);
  return 20;
}

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

export function computePlantStatus(plant: GardenPlantDB, now: Date = new Date()): PlantStatus {
  const waterInterval = getWateringIntervalDays(plant.water_frequency);
  const fertInterval = getFertilizerIntervalDays(plant.fertilizer_frequency);

  const lastWater = plant.last_watered ? new Date(plant.last_watered) : null;
  const lastFert = plant.last_fertilized ? new Date(plant.last_fertilized) : null;
  const created = new Date(plant.created_at);

  // Se nunca foi regada/adubada, conta a partir da criação
  const referenceWater = lastWater ?? created;
  const referenceFert = lastFert ?? created;

  const daysSinceWater = daysBetween(referenceWater, now);
  const daysSinceFert = daysBetween(referenceFert, now);

  const waterDueInDays = waterInterval - daysSinceWater;
  const fertilizerDueInDays = fertInterval - daysSinceFert;

  // Status de água
  let waterStatus: "ok" | "atrasado" | "critico" = "ok";
  const waterOverdueRatio = daysSinceWater / waterInterval;
  if (waterOverdueRatio >= 2.5) waterStatus = "critico";       // muito atrasado
  else if (waterOverdueRatio >= 1) waterStatus = "atrasado";   // já passou da hora

  // Status de adubo
  let fertilizerStatus: "ok" | "atrasado" | "critico" = "ok";
  const fertOverdueRatio = daysSinceFert / fertInterval;
  if (fertOverdueRatio >= 2) fertilizerStatus = "critico";
  else if (fertOverdueRatio >= 1) fertilizerStatus = "atrasado";

  // Cálculo de saúde: água tem peso maior que adubo (planta morre sem água)
  // Água: até 100% no prazo, perde rapidamente quando atrasa
  let waterHealth = 100;
  if (waterOverdueRatio > 1) {
    // perde ~25 pontos por intervalo extra atrasado
    waterHealth = Math.max(0, 100 - (waterOverdueRatio - 1) * 60);
  }

  let fertHealth = 100;
  if (fertOverdueRatio > 1) {
    fertHealth = Math.max(20, 100 - (fertOverdueRatio - 1) * 30);
  }

  // Saúde final: água 70% + adubo 30%
  const health = Math.round(waterHealth * 0.7 + fertHealth * 0.3);

  // Necessidades (true assim que vence o prazo)
  const needsWater = waterDueInDays <= 0;
  const needsFertilizer = fertilizerDueInDays <= 0;
  const needsPruning = plant.needs_pruning ?? false;

  // Nível de alerta geral
  let alertLevel: "saudavel" | "atencao" | "critico" = "saudavel";
  let alertMessage = "Planta saudável";

  if (waterStatus === "critico") {
    alertLevel = "critico";
    alertMessage = `Sem água há ${daysSinceWater} dias — risco de morte`;
  } else if (waterStatus === "atrasado") {
    alertLevel = "atencao";
    alertMessage = `Atrasada para regar há ${daysSinceWater - waterInterval} dia(s)`;
  } else if (fertilizerStatus === "critico") {
    alertLevel = "critico";
    alertMessage = `Sem adubo há ${daysSinceFert} dias — desenvolvimento comprometido`;
  } else if (fertilizerStatus === "atrasado") {
    alertLevel = "atencao";
    alertMessage = `Adubação atrasada há ${daysSinceFert - fertInterval} dia(s)`;
  } else if (needsWater) {
    alertLevel = "atencao";
    alertMessage = "Hora de regar";
  } else if (needsFertilizer) {
    alertLevel = "atencao";
    alertMessage = "Hora de adubar";
  }

  return {
    health,
    needsWater,
    needsFertilizer,
    needsPruning,
    waterStatus,
    fertilizerStatus,
    daysSinceWater,
    daysSinceFertilizer: daysSinceFert,
    waterDueInDays,
    fertilizerDueInDays,
    alertLevel,
    alertMessage,
  };
}
