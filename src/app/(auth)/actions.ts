"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase/server";
import { safeNext } from "@/server/auth";

/** `values` devolve o que foi digitado (nunca a senha): o React 19 limpa o formulário após cada envio. */
export type AuthState = {
  error?: string;
  message?: string;
  fields?: Record<string, string>;
  values?: Record<string, string>;
};

function firstErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) out[String(issue.path[0])] ??= issue.message;
  return out;
}

function text(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/** Erros do Supabase Auth traduzidos pelo código (com o texto como reserva), sem vazar detalhe interno. */
function translate(error: { code?: string; message: string }): string {
  switch (error.code) {
    case "invalid_credentials":
      return "E-mail ou senha incorretos.";
    case "email_not_confirmed":
      return "Confirme seu e-mail antes de entrar — enviamos um link na hora do cadastro.";
    case "user_already_exists":
    case "email_exists":
      return "Já existe uma conta com este e-mail. Entre ou recupere o acesso.";
    case "weak_password":
      return "Senha fraca. Use pelo menos 8 caracteres, misturando letras e números.";
    case "email_address_invalid":
      return "Esse e-mail não parece válido. Confira o endereço.";
    case "over_email_send_rate_limit":
      return "Limite de envio de e-mails atingido. Tente de novo mais tarde ou entre com e-mail e senha, se já tiver conta.";
    case "over_request_rate_limit":
      return "Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.";
  }
  const m = error.message.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (m.includes("email rate limit")) return "Limite de envio de e-mails atingido. Tente de novo mais tarde ou entre com e-mail e senha, se já tiver conta.";
  if (m.includes("rate limit") || m.includes("too many")) return "Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.";
  return "Não deu certo agora. Tente de novo em instantes.";
}

const emailSchema = z.email({ error: "E-mail inválido." }).max(120);

const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { error: "Digite sua senha." }),
});

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const values = { email: text(formData, "email") };
  const parsed = signInSchema.safeParse({ email: values.email, password: formData.get("password") });
  if (!parsed.success) return { fields: firstErrors(parsed.error), values };
  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: translate(error), values };
  redirect(safeNext(formData.get("next")));
}

const signUpSchema = z.object({
  name: z.string().trim().min(2, { error: "Como podemos te chamar?" }).max(80),
  email: emailSchema,
  password: z
    .string()
    .min(8, { error: "Mínimo de 8 caracteres." })
    .regex(/[a-zA-Z]/, { error: "Use pelo menos uma letra." })
    .regex(/\d/, { error: "Use pelo menos um número." }),
});

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const values = { name: text(formData, "name"), email: text(formData, "email") };
  const parsed = signUpSchema.safeParse({ ...values, password: formData.get("password") });
  if (!parsed.success) return { fields: firstErrors(parsed.error), values };
  const next = safeNext(formData.get("next"));
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { name: parsed.data.name },
      emailRedirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) return { error: translate(error), values };
  // Com "Confirm email" desligado no Supabase, já volta com sessão
  if (data.session) redirect(next);
  return { message: `Enviamos um link de confirmação para ${parsed.data.email}. Abra o e-mail para ativar a conta.` };
}

export async function sendMagicLink(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const values = { email: text(formData, "email") };
  const parsed = emailSchema.safeParse(values.email);
  if (!parsed.success) return { fields: { email: "Digite um e-mail válido para receber o link." }, values };
  const next = safeNext(formData.get("next"));
  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { emailRedirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}`, shouldCreateUser: true },
  });
  if (error) return { error: translate(error), values };
  return { message: `Link de acesso enviado para ${parsed.data}. Ele vale por 1 hora.` };
}

export async function signInWithGoogle(formData: FormData): Promise<void> {
  const next = safeNext(formData.get("next"));
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) redirect(`/entrar?erro=google`);
  redirect(data.url);
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  redirect("/");
}
