export type ContentSecurityPolicyMode = "development" | "production";

const CONTENT_SECURITY_POLICY_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
] as const;

const DEVELOPMENT_CONNECT_SOURCES = [
  "'self'",
  "http://127.0.0.1:5173",
  "ws://127.0.0.1:5173",
] as const;

function buildConnectSrcDirective(mode: ContentSecurityPolicyMode): string {
  const sources =
    mode === "development" ? DEVELOPMENT_CONNECT_SOURCES : ["'self'"];

  return `connect-src ${sources.join(" ")}`;
}

export function buildContentSecurityPolicy(
  mode: ContentSecurityPolicyMode
): string {
  return [
    ...CONTENT_SECURITY_POLICY_DIRECTIVES.slice(0, 5),
    buildConnectSrcDirective(mode),
    ...CONTENT_SECURITY_POLICY_DIRECTIVES.slice(5),
  ].join("; ");
}
