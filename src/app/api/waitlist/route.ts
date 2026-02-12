import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    // 1) Leer el body como texto para evitar que request.json() reviente sin info
    const raw = await request.text();
    console.log("[waitlist] raw body:", raw);

    // 2) Parsear JSON de forma segura
    let email: string | undefined;
    try {
      const body = raw ? JSON.parse(raw) : {};
      email = body?.email;
    } catch (e) {
      console.error("[waitlist] JSON parse error:", e);
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // 3) Validar email
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 4) Crear cliente supabase (si aquí peta, lo veremos en logs)
    const supabase = getSupabase();

    // 5) Check duplicado SIN romper si no existe (maybeSingle)
    const { data: existing, error: selectError } = await supabase
      .from("waitlist")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (selectError) {
      console.error("[waitlist] select error:", selectError);
      // no necesariamente es fatal, pero lo dejamos claro
    }

    if (existing) {
      return NextResponse.json(
        { message: "You're already on the list! We'll be in touch soon." },
        { status: 200 }
      );
    }

    // 6) Insert
    const { error: insertError } = await supabase
      .from("waitlist")
      .insert({ email: normalizedEmail });

    if (insertError) {
      console.error("[waitlist] insert error:", insertError);
      return NextResponse.json(
        { error: insertError.message }, // <- importante: ahora verás el motivo real
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Welcome to the waitlist! We'll notify you when Super Prompts launches." },
      { status: 201 }
    );
  } catch (err: any) {
    // CLAVE: antes no logueabas nada aquí
    console.error("[waitlist] FATAL:", err);
    return NextResponse.json(
      { error: err?.message || "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}