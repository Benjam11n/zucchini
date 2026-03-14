import { buildContentSecurityPolicy } from "@/shared/security/content-security-policy";
import type { ContentSecurityPolicyMode } from "@/shared/security/content-security-policy";

function getDirective(
  policy: string,
  directiveName: string
): string | undefined {
  return policy
    .split("; ")
    .find((directive) => directive.startsWith(`${directiveName} `));
}

function expectSharedDirectives(mode: ContentSecurityPolicyMode): void {
  const policy = buildContentSecurityPolicy(mode);

  const directives = [
    "default-src 'self'",
    "script-src 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
  ];

  expect(
    directives.every((directive) => policy.includes(directive))
  ).toBeTruthy();

  const scriptSrcDirective = getDirective(policy, "script-src");
  expect(scriptSrcDirective).toBe("script-src 'self'");
  expect(scriptSrcDirective).not.toContain("'unsafe-inline'");
}

describe("content security policy builder", () => {
  it("builds a tight production policy", () => {
    const policy = buildContentSecurityPolicy("production");

    expect(policy).toContain("connect-src 'self'");
    expect(policy).not.toContain("127.0.0.1");
    expect(policy).not.toContain("localhost");
    expect(policy).not.toContain("ws://");
    expect(policy).not.toContain("http://");

    expectSharedDirectives("production");
  });

  it("allows the Vite dev server during development", () => {
    const policy = buildContentSecurityPolicy("development");

    expect(policy).toContain(
      "connect-src 'self' http://127.0.0.1:5173 ws://127.0.0.1:5173"
    );

    expectSharedDirectives("development");
  });
});
