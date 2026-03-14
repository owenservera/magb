import * as fs from "fs";
import * as yaml from "yaml";
import "dotenv/config";

export interface ModelConfig {
  provider: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface ModelsConfig {
  skeleton: ModelConfig;
  expansion: ModelConfig;
  validation: ModelConfig;
}

export interface GenerationConfig {
  models: ModelsConfig;
  maxConcurrentRequests: number;
  budgetLimitUsd: number;
  maxRetries: number;
  retryBackoffBase: number;
  defaultImplementationLanguages: string[];
}

export interface OutputConfig {
  baseDir: string;
  formats: string[];
}

export interface ObservabilityConfig {
  healingCycleHours: number;
  dailyHealBudgetUsd: number;
  snapshotIntervalHours: number;
  versionCheckIntervalDays: number;
}

export interface Config {
  generation: GenerationConfig;
  output: OutputConfig;
  observability: ObservabilityConfig;
}

const DEFAULT_MODEL: ModelConfig = {
  provider: "zai",
  model: "glm-4.7-flash",
  maxTokens: 4096,
  temperature: 0.1,
};

const DEFAULT_CONFIG: Config = {
  generation: {
    models: {
      skeleton: { ...DEFAULT_MODEL },
      expansion: { ...DEFAULT_MODEL, maxTokens: 8192 },
      validation: { ...DEFAULT_MODEL, temperature: 0.0 },
    },
    maxConcurrentRequests: 10,
    budgetLimitUsd: 50.0,
    maxRetries: 3,
    retryBackoffBase: 2.0,
    defaultImplementationLanguages: ["python", "javascript"],
  },
  output: {
    baseDir: "./output",
    formats: ["json", "markdown"],
  },
  observability: {
    healingCycleHours: 6,
    dailyHealBudgetUsd: 5.0,
    snapshotIntervalHours: 1,
    versionCheckIntervalDays: 7,
  },
};

export function loadConfig(configPath: string = "config.yaml"): Config {
  let rawConfig: any = {};
  if (fs.existsSync(configPath)) {
    const fileContent = fs.readFileSync(configPath, "utf8");
    rawConfig = yaml.parse(fileContent) || {};
  }
  
  // Merge defaults
  return {
    generation: {
      ...DEFAULT_CONFIG.generation,
      ...(rawConfig.generation || {}),
      models: {
        ...DEFAULT_CONFIG.generation.models,
        ...(rawConfig.generation?.models || {}),
      }
    },
    output: {
      ...DEFAULT_CONFIG.output,
      ...(rawConfig.output || {}),
    },
    observability: {
      ...DEFAULT_CONFIG.observability,
      ...(rawConfig.observability || {}),
    }
  };
}
