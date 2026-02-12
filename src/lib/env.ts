// Environment variable validation and helpers

const REQUIRED_VARS = {
  supabase: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'],
} as const;

const OPTIONAL_GROUPS = {
  stripe: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'],
  twilio: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_WHATSAPP_FROM'],
  ai: ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY'],
  app: ['NEXT_PUBLIC_APP_URL', 'WA_VERIFY_TOKEN'],
} as const;

interface EnvValidation {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

export function validateEnv(): EnvValidation {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required vars
  for (const [group, vars] of Object.entries(REQUIRED_VARS)) {
    for (const v of vars) {
      if (!process.env[v]) {
        missing.push(`${group}: ${v}`);
      }
    }
  }

  // Check optional groups — warn if partially configured
  for (const [group, vars] of Object.entries(OPTIONAL_GROUPS)) {
    const configured = vars.filter((v) => !!process.env[v]);
    if (configured.length > 0 && configured.length < vars.length) {
      const unconfigured = vars.filter((v) => !process.env[v]);
      warnings.push(`${group}: partially configured (missing ${unconfigured.join(', ')})`);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

export function isTwilioConfigured(): boolean {
  return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
}

export function isStripeConfigured(): boolean {
  return !!(process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
}

export function isAIConfigured(): boolean {
  return !!(process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY);
}

export function logEnvStatus(): void {
  if (process.env.NODE_ENV !== 'development') return;

  const { valid, missing, warnings } = validateEnv();

  if (!valid) {
    console.warn('\n[Cactus] Missing required environment variables:');
    missing.forEach((m) => console.warn(`  - ${m}`));
  }

  if (warnings.length > 0) {
    console.warn('\n[Cactus] Environment warnings:');
    warnings.forEach((w) => console.warn(`  - ${w}`));
  }

  if (valid && warnings.length === 0) {
    console.log('[Cactus] Environment: all configured');
  }
}
