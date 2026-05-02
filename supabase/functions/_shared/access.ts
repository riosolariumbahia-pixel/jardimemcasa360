// Validação de acesso server-side (única fonte de verdade).
// Usa a função SQL `has_full_access` que combina status real Stripe + trial.
import { createClient } from "npm:@supabase/supabase-js@2";

let _admin: ReturnType<typeof createClient> | null = null;
function admin() {
  if (!_admin) {
    _admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
  }
  return _admin;
}

export type AccessEnv = "sandbox" | "live";

export interface AuthedUser {
  id: string;
  email?: string;
}

/** Valida o JWT e retorna o usuário autenticado (ou null). */
export async function getAuthedUser(req: Request): Promise<AuthedUser | null> {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const { data, error } = await admin().auth.getUser(token);
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? undefined };
}

/**
 * Confirma server-side se o usuário tem acesso completo (Premium ou Trial ativo).
 * Usa a função SQL `has_full_access` — fonte de verdade alimentada pelo webhook.
 */
export async function hasFullAccess(userId: string, env: AccessEnv = "live"): Promise<boolean> {
  const { data, error } = await admin().rpc("has_full_access", {
    user_uuid: userId,
    check_env: env,
  });
  if (error) {
    console.error("has_full_access RPC error:", error);
    return false;
  }
  return data === true;
}

/** Confirma server-side se o usuário tem assinatura paga ativa (sem contar trial). */
export async function hasActiveSubscription(userId: string, env: AccessEnv = "live"): Promise<boolean> {
  const { data, error } = await admin().rpc("has_active_subscription", {
    user_uuid: userId,
    check_env: env,
  });
  if (error) {
    console.error("has_active_subscription RPC error:", error);
    return false;
  }
  return data === true;
}
