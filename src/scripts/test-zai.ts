/**
 * Test script for ZaiClient
 * Run: bun run src/scripts/test-zai.ts
 */

import { ZaiClient } from "../engine/llm/ZaiClient";
import { loadConfig } from "../engine/config";

async function testZaiClient() {
  console.log("🧪 Testing ZaiClient...\n");

  const config = loadConfig();
  
  // Check API key
  const apiKey = process.env.ZAI_API_KEY;
  if (!apiKey) {
    console.error("❌ ZAI_API_KEY not set in environment");
    process.exit(1);
  }
  console.log("✅ API Key loaded");
  console.log(`   Model: ${config.generation.models.expansion.model}`);
  console.log(`   Base URL: https://api.z.ai/api/coding/paas/v4`);

  const client = new ZaiClient(config);
  console.log("✅ ZaiClient initialized\n");

  // Test 1: Simple text generation
  console.log("📝 Test 1: generateText");
  try {
    const response = await client.generateText(
      "What is 2 + 2? Answer in one sentence.",
      undefined,
      undefined,
      0.3
    );
    console.log(`   Response: ${response}`);
    console.log("✅ Text generation works\n");
  } catch (err: any) {
    console.error(`❌ Text generation failed: ${err.message}\n`);
    process.exit(1);
  }

  // Test 2: JSON generation
  console.log("📝 Test 2: generateJson");
  try {
    const jsonResponse = await client.generateJson<{ name: string; role: string }>(
      "Create a user profile for a developer named Alice",
      "You are a JSON generator. Return valid JSON.",
      undefined,
      0.3
    );
    console.log(`   Response: ${JSON.stringify(jsonResponse, null, 2)}`);
    console.log("✅ JSON generation works\n");
  } catch (err: any) {
    console.error(`❌ JSON generation failed: ${err.message}\n`);
    process.exit(1);
  }

  // Test 3: With system prompt (may hit transient API errors)
  console.log("📝 Test 3: generateText with system prompt (best effort)");
  try {
    const response = await client.generateText(
      "Say hello in 3 words",
      "You are a helpful assistant who speaks like a pirate.",
      undefined,
      0.7
    );
    console.log(`   Response: ${response}`);
    console.log("✅ System prompt works\n");
  } catch (err: any) {
    console.log(`   ⚠️  System prompt test skipped (API error: ${err.message})\n`);
  }

  console.log("🎉 Core tests passed!");
}

testZaiClient().catch((err) => {
  console.error("💥 Test failed:", err);
  process.exit(1);
});
