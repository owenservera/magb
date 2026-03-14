/**
 * The universal concept taxonomy.
 * 
 * This is hand-curated (not AI-generated) because it's the structural
 * foundation of the entire database. Getting this wrong means everything
 * built on top is poorly organized.
 * 
 * It maps domains -> subdomains -> specific concepts.
 */

export interface ConceptDefinition {
  id: string; // e.g., "lexical.keywords"
  name: string; // e.g., "Keywords & Reserved Words"
  description: string;
}

export interface ConceptSubdomain {
  _description: string;
  concepts: ConceptDefinition[];
}

export interface ConceptDomain {
  [subdomainId: string]: ConceptSubdomain;
}

export const CONCEPT_TAXONOMY: Record<string, ConceptDomain> = {
  // ══════════════════════════════════════════════════════════
  // PROGRAMMING LANGUAGE CONCEPTS
  // ══════════════════════════════════════════════════════════
  language: {
    lexical: {
      _description: "How source text is tokenized",
      concepts: [
        {
          id: "lexical.keywords",
          name: "Keywords & Reserved Words",
          description: "Words with special meaning that cannot be used as identifiers",
        },
        {
          id: "lexical.identifiers",
          name: "Identifiers & Naming",
          description: "Rules for naming variables, functions, types, etc.",
        },
        {
          id: "lexical.literals",
          name: "Literals",
          description: "Constant values written directly in source code",
        },
        {
          id: "lexical.literals.string",
          name: "String Literals",
          description: "String, character, and text literal syntax",
        },
        {
          id: "lexical.comments",
          name: "Comments",
          description: "Single-line, multi-line, and doc comment syntax",
        },
        {
          id: "lexical.operators",
          name: "Operators",
          description: "Symbolic operators and their precedence",
        },
      ],
    },
    type_system: {
      _description: "How values are classified and constrained",
      concepts: [
        {
          id: "types.primitive",
          name: "Primitive/Scalar Types",
          description: "Built-in atomic types: integers, floats, booleans, characters",
        },
        {
          id: "types.composite",
          name: "Composite/Compound Types",
          description: "Types built from other types",
        },
        {
          id: "types.composite.array",
          name: "Arrays/Lists",
          description: "Ordered, indexed collections",
        },
        {
          id: "types.composite.map",
          name: "Maps/Dictionaries/Hash Tables",
          description: "Key-value associative collections",
        },
      ],
    },
    control_flow: {
      _description: "How execution order is determined",
      concepts: [
        {
          id: "control.conditional",
          name: "Conditionals",
          description: "If/else, ternary, and conditional expressions",
        },
        {
          id: "control.iteration",
          name: "Iteration/Looping",
          description: "Repeating code execution",
        },
        {
          id: "control.exceptions",
          name: "Exception Handling",
          description: "try/catch/finally and throw/raise",
        },
      ],
    },
    functions: {
      _description: "Callable units of code",
      concepts: [
        {
          id: "functions.definition",
          name: "Function Definition",
          description: "Declaring and defining functions",
        },
        {
          id: "functions.parameters",
          name: "Parameters & Arguments",
          description: "Positional, keyword, default, variadic, rest parameters",
        },
        {
          id: "functions.return",
          name: "Return Values",
          description: "Single, multiple, and void returns",
        },
      ],
    },
    memory: {
      _description: "How memory is managed",
      concepts: [
        {
          id: "memory.stack_heap",
          name: "Stack vs Heap Allocation",
          description: "",
        },
        {
          id: "memory.garbage_collection",
          name: "Garbage Collection",
          description: "",
        },
      ],
    },
    concurrency: {
      _description: "Parallel and concurrent execution",
      concepts: [
        {
          id: "concurrency.threads",
          name: "Threads",
          description: "",
        },
        {
          id: "concurrency.async",
          name: "Async/Await",
          description: "",
        },
      ],
    },
  },

  // ══════════════════════════════════════════════════════════
  // FILE FORMAT CONCEPTS
  // ══════════════════════════════════════════════════════════
  format: {
    structure: {
      _description: "How formats are physically organized",
      concepts: [
        {
          id: "format.container",
          name: "Container/Archive Structure",
          description: "",
        },
        {
          id: "format.header",
          name: "Headers & Magic Bytes",
          description: "",
        },
        {
          id: "format.metadata",
          name: "Metadata & Properties",
          description: "",
        },
      ],
    },
    image: {
      _description: "Image format concepts",
      concepts: [
        {
          id: "format.img.pixel",
          name: "Pixel Format & Color Depth",
          description: "",
        },
        {
          id: "format.img.compression_lossless",
          name: "Lossless Compression",
          description: "",
        },
      ],
    },
  },
};
