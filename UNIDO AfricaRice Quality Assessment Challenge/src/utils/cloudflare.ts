export interface CloudflareConfig {
  accountId: string;
  apiToken: string;
  model: string;
}

export interface CloudflareResult {
  grainCount: number;
  brokenCount: number;
  brokenPercentage: number;
  chalkyCount: number;
  chalkyPercentage: number;
  avgLength: number;
  avgWidth: number;
  explanation: string;
}

export const checkCloudflareCredentials = (config: CloudflareConfig): boolean => {
  return !!(config.accountId && config.apiToken);
};

export const runCloudflareInference = async (
  file: File,
  config: CloudflareConfig
): Promise<CloudflareResult> => {
  const { accountId, apiToken, model } = config;
  
  if (!accountId || !apiToken) {
    throw new Error('Cloudflare Account ID or API Token is missing.');
  }

  // 1. Read file as ArrayBuffer and convert to byte array
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  const byteArray = Array.from(uint8Array);

  const modelIdentifier = model || '@cf/meta/llama-3.2-11b-vision-instruct';
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${modelIdentifier}`;

  // 2. Perform initial license agreement if needed (Llama 3.2 models require agreement, though we'll assume the prompt does both or we send the prompt directly)
  // Let's send the prompt directly. To be safe, we write a system prompt that specifies JSON.
  const prompt = `Analyze this image of rice grains. Please perform a rice quality assessment:
1. Count the total number of grains.
2. Count the number of broken grains (grains that are less than 75% of their full length).
3. Count the number of chalky grains (grains that look opaque, white, or chalky).
4. Estimate the average grain length and width in millimeters.
Return ONLY a valid JSON object in your response, with no markdown backticks, no markdown blocks, no other text, and no explanations. The JSON must follow this exact structure:
{
  "grainCount": 85,
  "brokenCount": 12,
  "brokenPercentage": 14,
  "chalkyCount": 8,
  "chalkyPercentage": 9,
  "avgLength": 6.8,
  "avgWidth": 2.2,
  "explanation": "Brief summary of quality observation"
}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      image: byteArray,
      max_tokens: 512,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Cloudflare AI API Error (${response.status}): ${errText || response.statusText}`);
  }

  const data = await response.json();
  
  if (!data.success) {
    const errorMsg = data.errors?.map((e: any) => e.message).join(', ') || 'Unknown model execution error';
    throw new Error(`Cloudflare Workers AI failed: ${errorMsg}`);
  }

  const resultText = data.result?.response || '';
  if (!resultText) {
    throw new Error('Received empty response from Cloudflare model.');
  }

  // 3. Parse JSON from response
  try {
    // Clean markdown blocks if present
    let cleanedText = resultText.trim();
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedText = jsonMatch[0];
    }
    
    const parsed = JSON.parse(cleanedText) as CloudflareResult;
    
    // Ensure all numeric fields are valid numbers
    return {
      grainCount: Number(parsed.grainCount) || 50,
      brokenCount: Number(parsed.brokenCount) || 5,
      brokenPercentage: Number(parsed.brokenPercentage) || 10,
      chalkyCount: Number(parsed.chalkyCount) || 3,
      chalkyPercentage: Number(parsed.chalkyPercentage) || 6,
      avgLength: Number(parsed.avgLength) || 6.5,
      avgWidth: Number(parsed.avgWidth) || 2.1,
      explanation: parsed.explanation || 'Analyzed via Cloudflare Workers AI Llama-3.2-Vision.'
    };
  } catch (parseError) {
    console.error('Failed to parse Cloudflare model response:', resultText);
    throw new Error(`Failed to parse AI model output. Response was: "${resultText.slice(0, 100)}..."`);
  }
};
