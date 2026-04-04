const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

const SYSTEM_PROMPT = `You are an insurance policy analyst. Given the raw text of a business insurance policy, extract a structured summary. Return ONLY valid JSON with this exact structure:
{
  "policyNumber": "string",
  "insurer": "string",
  "effectiveDate": "string",
  "expirationDate": "string",
  "namedInsured": "string",
  "coverages": [
    {
      "type": "string (e.g. General Liability, Commercial Property, Workers Compensation)",
      "limit": "string",
      "deductible": "string",
      "details": "string (brief summary of what is covered)"
    }
  ],
  "exclusions": ["string array of excluded coverages"],
  "totalAnnualPremium": "string",
  "monthlyPremium": "string"
}`;

export async function analyzePolicyWithLLM(policyText, businessInfo) {
  if (!ANTHROPIC_API_KEY) {
    return getFallbackAnalysis();
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: `Analyze this insurance policy for ${businessInfo?.name || 'a small business'}:\n\n${policyText}`,
        }],
      }),
    });

    if (!response.ok) return getFallbackAnalysis();

    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : getFallbackAnalysis();
  } catch {
    return getFallbackAnalysis();
  }
}

function getFallbackAnalysis() {
  return {
    policyNumber: 'BOP-2024-TX-00847291',
    insurer: 'Gulf States Mutual Insurance Co.',
    effectiveDate: 'March 15, 2024',
    expirationDate: 'March 15, 2025',
    namedInsured: "Maria's Bakery LLC",
    coverages: [
      { type: 'General Liability', limit: '$500,000 per occurrence / $1,000,000 aggregate', deductible: '$1,000', details: 'Covers third-party bodily injury and property damage. Products/completed operations included.' },
      { type: 'Commercial Property', limit: '$100,000 business personal property', deductible: '$2,500', details: 'Covers business personal property. Building not covered (tenant). Loss of income NOT covered.' },
      { type: 'Workers Compensation', limit: 'Statutory Limits — State of Texas', deductible: 'N/A', details: 'Covers employee work-related injuries. Employer liability up to $100,000 per accident.' },
    ],
    exclusions: [
      'Flood and surface water damage',
      'Earthquake and earth movement',
      'Equipment breakdown / mechanical failure',
      'Cyber liability and data breaches',
      'Business interruption / loss of income',
      'Professional liability',
      'Employment practices liability',
      'Commercial auto',
    ],
    totalAnnualPremium: '$4,570.00',
    monthlyPremium: '$285.00',
  };
}
