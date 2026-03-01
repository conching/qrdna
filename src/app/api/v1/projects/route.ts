import { createClient } from "@/lib/supabase/server";
import { apiError, apiSuccess } from "@/lib/api/errors";

// ---------------------------------------------------------------------------
// GET /api/v1/projects  — List projects for the authenticated user
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError(401, "Authentication required", "UNAUTHORIZED");
    }

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", user.id)
      .order("name", { ascending: true });

    if (error) {
      return apiError(500, error.message, "DB_ERROR");
    }

    return apiSuccess(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return apiError(500, message, "INTERNAL_ERROR");
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/projects  — Create a new project
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError(401, "Authentication required", "UNAUTHORIZED");
    }

    const body = (await request.json()) as {
      name: string;
      description?: string;
      color?: string;
      icon?: string;
    };

    if (!body.name || body.name.trim().length === 0) {
      return apiError(400, "Project name is required", "VALIDATION_ERROR");
    }

    const { data, error } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        name: body.name.trim(),
        description: body.description ?? null,
        color: body.color ?? null,
        icon: body.icon ?? null,
      })
      .select()
      .single();

    if (error) {
      return apiError(500, error.message, "DB_ERROR");
    }

    return apiSuccess(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return apiError(500, message, "INTERNAL_ERROR");
  }
}
