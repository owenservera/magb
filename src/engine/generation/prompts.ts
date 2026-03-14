export class PromptTemplates {
  static discoverCapabilities(target: string, targetType: string): string {
    return `You are an expert systems architect analyzing ${target} (${targetType}).
Break down the complete capability surface of ${target} into an exhaustive list of discrete capabilities.
Group them by category. Do not describe HOW they are implemented, just WHAT can be done.

Respond ONLY with this JSON structure:
{
  "capabilities": [
    {
      "id": "unique_id_string (e.g. 'draw_rectangle')",
      "name": "Human readable name",
      "category": "Broad category (e.g. 'Shapes')",
      "description": "One sentence description of what this capability does"
    }
  ]
}`;
  }

  static extractStructuralTemplate(target: string, capability: any): string {
    return `You are a format implementation expert.
Provide the exact structural template required to implement the capability "${capability.name}" in ${target}.
This should be the irreducible building block (the "atom").

Respond ONLY with this JSON structure:
{
  "template": {
    "raw": "The exact format string (XML, JSON, binary representation, etc.) with {{variable}} placeholders",
    "format_notes": "Any notes on encoding, namespaces, etc."
  },
  "variables": [
    {
      "name": "Variable name from placeholder",
      "type": "Data type",
      "description": "What this controls",
      "default": "Default value if any"
    }
  ],
  "assembly_code": {
    "language": "python",
    "code": "Minimal Python code snippet to assemble this specific template with its variables"
  }
}`;
  }

  static extractAlgorithm(target: string, capability: any): string {
    return `You are a computer science expert.
If the capability "${capability.name}" in ${target} requires a specific algorithm or mathematical foundation (e.g. coordinate conversion, compression, encoding), provide the exact algorithm details.
If it does not require an algorithm (it is purely structural), you should still return a JSON response but with empty algorithm details.

Respond ONLY with this JSON structure:
{
  "algorithms": [
    {
      "name": "Algorithm name",
      "purpose": "What this algorithm computes",
      "pseudocode": ["step 1", "step 2"],
      "implementations": {
        "python": {
          "code": "Complete, runnable python implementation"
        }
      },
      "test_vectors": [
        {
          "input": "Example input",
          "expected_output": "Expected output"
        }
      ]
    }
  ]
}`;
  }

  static extractCoordinateSystem(target: string): string {
    return `You are a format expert. Provide the complete coordinate and unit system used by ${target}.

Respond ONLY with this JSON structure:
{
  "coordinate_system": {
    "primary_unit": "EMU | pixel | point | twip | etc.",
    "origin": "top-left | bottom-left | center",
    "y_direction": "down | up",
    "conversions": {
      "unit_a_to_unit_b": "formula"
    }
  }
}`;
  }

  static extractMinimalValidFile(target: string): string {
    return `You are a format expert. Provide the absolute smallest minimal valid file structure for ${target}.

Respond ONLY with this JSON structure:
{
  "minimal_file": {
    "template": "The raw file structure (e.g. minimal XML, JSON, or hex dump of binary)",
    "assembly_code": {
      "language": "python",
      "code": "Python code to generate this minimal valid file and save it to disk"
    }
  }
}`;
  }
}
