import { TargetKind, TargetStatus } from "@prisma/client";

/**
 * The canonical registry of all targets, prioritized into tiers.
 * 
 * Tier 1: Generate first. Highest value, most users, best for validating the system.
 * Tier 2: Generate after Tier 1 is validated.
 * Tier 3: Generate for completeness.
 * Tier 4: Long tail — generate on demand.
 */

export interface TargetMetadata {
  id: string;
  name: string;
  tier: number;
  kind: TargetKind;
  description: string;
  familyId?: string;
  
  traits?: Record<string, any>;
  distinguishing?: string[];
  similarTo?: string[];
  
  extensions?: string[];
  mediaTypes?: string[];
  magicBytes?: string;
  specUrl?: string;

  status?: TargetStatus;
}

export const TARGET_REGISTRY: Record<string, TargetMetadata[]> = {
  // ══════════════════════════════════════════════════════════
  // PROGRAMMING LANGUAGES
  // ══════════════════════════════════════════════════════════
  languages: [
    {
      id: "python",
      name: "Python",
      tier: 1,
      kind: TargetKind.PROGRAMMING_LANGUAGE,
      description: "Python programming language",
      traits: {
        typing: "dynamic_gradual",
        memory: "gc",
        stdlib_size: "massive",
        paradigms: ["imperative", "oop", "functional"],
        has_concurrency: true,
        has_metaprogramming: true,
      },
      similarTo: ["ruby", "javascript"],
      specUrl: "https://docs.python.org/3/reference/",
    },
    {
      id: "javascript",
      name: "JavaScript",
      tier: 1,
      kind: TargetKind.PROGRAMMING_LANGUAGE,
      description: "JavaScript programming language (ECMAScript)",
      traits: {
        typing: "dynamic",
        memory: "gc",
        stdlib_size: "small", // language itself is small; ecosystem is huge
        paradigms: ["imperative", "oop_prototypal", "functional"],
        has_concurrency: true, // async/await, but single-threaded
      },
      similarTo: ["typescript", "python"],
      specUrl: "https://tc39.es/ecma262/",
    },
    {
      id: "typescript",
      name: "TypeScript",
      tier: 1,
      kind: TargetKind.PROGRAMMING_LANGUAGE,
      description: "TypeScript programming language",
      similarTo: ["javascript"],
    },
    {
      id: "rust",
      name: "Rust",
      tier: 1,
      kind: TargetKind.PROGRAMMING_LANGUAGE,
      description: "Rust programming language",
    },
    {
      id: "go",
      name: "Go",
      tier: 1,
      kind: TargetKind.PROGRAMMING_LANGUAGE,
      description: "Go programming language",
    },
  ],

  // ══════════════════════════════════════════════════════════
  // FILE FORMATS
  // ══════════════════════════════════════════════════════════
  file_formats: [
    {
      id: "json",
      name: "JSON",
      tier: 1,
      kind: TargetKind.DATA_FORMAT,
      description: "JavaScript Object Notation",
      specUrl: "https://www.json.org/",
      extensions: [".json"],
      mediaTypes: ["application/json"]
    },
    {
      id: "pptx",
      name: "PPTX",
      tier: 1,
      kind: TargetKind.FILE_FORMAT,
      description: "Office Open XML Presentation",
      specUrl: "ISO/IEC 29500",
      extensions: [".pptx"],
    },
    {
      id: "png",
      name: "PNG",
      tier: 1,
      kind: TargetKind.FILE_FORMAT,
      description: "Portable Network Graphics",
      extensions: [".png"],
      mediaTypes: ["image/png"],
      magicBytes: "89 50 4E 47 0D 0A 1A 0A"
    }
  ],

  // ══════════════════════════════════════════════════════════
  // PROTOCOLS
  // ══════════════════════════════════════════════════════════
  protocols: [
    {
      id: "http",
      name: "HTTP/1.1",
      tier: 1,
      kind: TargetKind.PROTOCOL,
      description: "Hypertext Transfer Protocol",
    }
  ]
};

export function getTier1Targets(): TargetMetadata[] {
  const tier1: TargetMetadata[] = [];
  for (const category of Object.values(TARGET_REGISTRY)) {
    for (const target of category) {
      if (target.tier === 1) {
        tier1.push(target);
      }
    }
  }
  return tier1;
}
