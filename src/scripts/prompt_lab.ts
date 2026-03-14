import { ZaiClient } from "../engine/llm/ZaiClient";
import { loadConfig } from "../engine/config";
import { PromptTemplates } from "../engine/generation/prompts";

async function main() {
  const config = loadConfig();
  const client = new ZaiClient(config);

  console.log("Testing Z.ai connection and response parser...");

  const target = "json";
  const targetType = "data_format";

  console.log(`\n--- Discovering capabilities for ${target} ---`);
  const prompt = PromptTemplates.discoverCapabilities(target, targetType);

  try {
    const result = await client.generateJson<{ capabilities: any[] }>(
      prompt,
      "You are an expert systems architect.",
      "glm-4.7-flash"
    );

    console.log("Successfully parsed JSON:");
    console.log(JSON.stringify(result, null, 2));
    
    if (result && result.capabilities && result.capabilities.length > 0) {
      console.log(`\nFound ${result.capabilities.length} capabilities.`);
      
      const firstCap = result.capabilities[0];
      console.log(`\n--- Extracting Structural Template for ${firstCap.name} ---`);
      
      // Delay to avoid rate limiting between API calls
      await new Promise(r => setTimeout(r, 3000));
      
      const templatePrompt = PromptTemplates.extractStructuralTemplate(target, firstCap);
      const templateResult = await client.generateJson(
        templatePrompt,
        "You are a format implementation expert.",
        "glm-4.7-flash"
      );
      
      console.log("Successfully parsed template JSON:");
      console.log(JSON.stringify(templateResult, null, 2));

    } else {
      console.log("No capabilities found or invalid response format.");
    }

  } catch (error) {
    console.error("Test failed:", error);
  }
}

main().catch(console.error);
