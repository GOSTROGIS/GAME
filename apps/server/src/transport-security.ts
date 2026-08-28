export function isAllowedWebSocketOrigin(origin: string | undefined, allowedOrigins: readonly string[], allowMissingOrigin: boolean): boolean {
  if (!origin) return allowMissingOrigin;
  try {
    const normalized = new URL(origin).origin;
    return allowedOrigins.some((allowed) => {
      try { return new URL(allowed).origin === normalized; }
      catch { return false; }
    });
  } catch { return false; }
}
