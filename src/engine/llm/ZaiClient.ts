import { Config } from "../config";
import { ResponseParser, ParseError } from "./ResponseParser";
import { globalRateLimiter } from "./RateLimiter";

export class ZaiClient {
  private apiKey: string;
  private baseURL: string;
  private defaultModel: string;
  private maxRetries: number;

  constructor(config: Config) {
    const apiKey = process.env.ZAI_API_KEY;
    if (!apiKey) {
      throw new Error("ZAI_API_KEY environment variable is missing.");
    }

    this.apiKey = apiKey;
    this.baseURL = "https://api.z.ai/api/coding/paas/v4";
    this.defaultModel = config.generation.models.expansion.model;
    this.maxRetries = config.generation.maxRetries || 5;
  }

  private async makeRequest(endpoint: string, payload: any): Promise<any> {
    let attempt = 0;
    const requestStart = Date.now();
    console.log(`🚀 [API CALL ${requestStart}] Starting request to ${endpoint}`);
    
    while (attempt <= this.maxRetries) {
      try {
        console.log(`⏳ [${Date.now()}] Attempt ${attempt + 1}/${this.maxRetries + 1} - Waiting for rate limiter token...`);
        const rateLimitStart = Date.now();
        await globalRateLimiter.waitForToken();
        const rateLimitWait = Date.now() - rateLimitStart;
        console.log(`✅ [${Date.now()}] Rate limiter token acquired after ${rateLimitWait}ms`);
        
        const apiCallStart = Date.now();
        console.log(`📡 [${apiCallStart}] Making API call to ${this.baseURL}${endpoint}`);
        
        const response = await fetch(`${this.baseURL}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify(payload)
        });

        const apiCallDuration = Date.now() - apiCallStart;
        console.log(`📥 [${Date.now()}] API call completed in ${apiCallDuration}ms - Status: ${response.status}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.log(`❌ [${Date.now()}] API Error ${response.status}: ${errorText}`);
          
          if (response.status === 429) {
            globalRateLimiter.recordRateLimitHit();
            const baseDelay = Math.pow(2, attempt) * 2000;
            const jitter = Math.random() * 1000; // Add up to 1 second of jitter
            const retryAfter = baseDelay + jitter;
            console.log(`🔄 [${Date.now()}] Rate limit hit! Retrying in ${(retryAfter/1000).toFixed(1)}s (attempt ${attempt + 1})`);
            await new Promise(r => setTimeout(r, retryAfter));
            attempt++;
            continue;
          }
          throw new Error(`API Error ${response.status}: ${errorText}`);
        }

        const totalDuration = Date.now() - requestStart;
        console.log(`🎉 [${Date.now()}] Request successful! Total duration: ${totalDuration}ms`);
        return await response.json();
      } catch (err: any) {
        const attemptDuration = Date.now() - requestStart;
        console.log(`💥 [${Date.now()}] Request failed after ${attemptDuration}ms: ${err.message}`);
        
        if (attempt >= this.maxRetries) {
          console.log(`🛑 [${Date.now()}] Max retries exceeded. Giving up.`);
          throw err;
        }
        globalRateLimiter.recordRetry();
        const retryDelay = Math.pow(2, attempt) * 1000;
        console.log(`🔄 [${Date.now()}] Retrying in ${retryDelay/1000}s...`);
        await new Promise(r => setTimeout(r, retryDelay));
        attempt++;
      }
    }
    throw new Error("Max retries exceeded");
  }

  async generateText(prompt: string, systemPrompt?: string, model?: string, temperature = 0.7): Promise<string> {
    const messages: any[] = [];
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    const data = await this.makeRequest('/chat/completions', {
      model: model || this.defaultModel,
      messages,
      temperature,
    });

    return data.choices?.[0]?.message?.content || "";
  }

  async generateJson<T>(prompt: string, systemPrompt?: string, model?: string, temperature = 0.1, schema?: any): Promise<T> {
    console.log(`📝 [PROMPT CONTENT] System: "${systemPrompt}"`);
    console.log(`📝 [PROMPT CONTENT] User: "${prompt.substring(0, 200)}${prompt.length > 200 ? "..." : ""}"`);
    
    const messages: any[] = [];
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({ role: "user", content: `${prompt}\n\nRespond with valid JSON only.` });

    const data = await this.makeRequest('/chat/completions', {
      model: model || this.defaultModel,
      messages,
      temperature,
      response_format: { type: "json_object" },
    });

    const content = data.choices?.[0]?.message?.content || "";
    
    try {
      return ResponseParser.parseJson<T>(content, schema);
    } catch (error) {
      console.error("Failed to parse JSON response:", error);
      throw error;
    }
  }
}
