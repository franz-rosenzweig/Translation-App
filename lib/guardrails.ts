export interface GuardrailsConfig {
  maxInputLength: number;
  bannedTerms: string[];
}

export interface GuardrailsResult {
  isValid: boolean;
  violations: Array<{
    type: 'length' | 'bannedTerm';
    message: string;
    term?: string;
    suggestion?: string;
  }>;
}

const DEFAULT_CONFIG: GuardrailsConfig = {
  maxInputLength: 10000, // 10k characters
  bannedTerms: [] // Project-specific banned terms can be added here
};

export function checkGuardrails(
  text: string,
  config: Partial<GuardrailsConfig> = {}
): GuardrailsResult {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const violations: GuardrailsResult['violations'] = [];

  // Check length
  if (text.length > finalConfig.maxInputLength) {
    violations.push({
      type: 'length',
      message: `Text exceeds ${finalConfig.maxInputLength} characters`,
      suggestion: 'Consider splitting into smaller sections'
    });
  }

  // Check banned terms
  if (finalConfig.bannedTerms.length > 0) {
    const foundTerms = finalConfig.bannedTerms.filter(term => 
      text.toLowerCase().includes(term.toLowerCase())
    );

    foundTerms.forEach(term => {
      violations.push({
        type: 'bannedTerm',
        term,
        message: `Contains banned term: "${term}"`,
        suggestion: 'Please remove or replace this term'
      });
    });
  }

  return {
    isValid: violations.length === 0,
    violations
  };
}

export function validateEditedText(
  text: string,
  config: Partial<GuardrailsConfig> = {}
): GuardrailsResult {
  return checkGuardrails(text, config);
}

export function buildReEnforcementPrompt(violations: GuardrailsResult['violations']): string {
  const bannedTerms = violations
    .filter(v => v.type === 'bannedTerm')
    .map(v => v.term);

  if (bannedTerms.length === 0) return '';

  return `
IMPORTANT: The following terms MUST NOT appear in the output:
${bannedTerms.map(term => `- "${term}"`).join('\n')}

Please revise the text to avoid these terms while preserving the meaning.
`;
}
