import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ValidationEngine } from './ValidationEngine';
import { UniversalKnowledgeStore } from '@/engine/store';

// Mock the store
vi.mock('@/engine/store', () => ({
  UniversalKnowledgeStore: vi.fn().mockImplementation(() => ({
    db: {
      algorithm: {
        findUnique: vi.fn(),
      },
      atom: {
        findUnique: vi.fn(),
      },
      example: {
        findUnique: vi.fn(),
      },
    },
  })),
}));

describe('ValidationEngine', () => {
  let engine: ValidationEngine;
  let mockStore: UniversalKnowledgeStore;

  beforeEach(() => {
    mockStore = new UniversalKnowledgeStore();
    engine = new ValidationEngine(mockStore);
  });

  describe('validateAlgorithm', () => {
    it('should return failure when algorithm not found', async () => {
      vi.mocked(mockStore.db.algorithm.findUnique).mockResolvedValue(null);

      const report = await engine.validateAlgorithm('non-existent-id');
      
      expect(report.total).toBe(1);
      expect(report.passed).toBe(0);
      expect(report.failed).toBe(1);
      expect(report.results[0].passed).toBe(false);
      expect(report.results[0].message).toBe('Algorithm not found');
    });

    it('should validate algorithm completeness', async () => {
      vi.mocked(mockStore.db.algorithm.findUnique).mockResolvedValue({
        id: 'test-algo',
        name: 'Test Algorithm',
        pseudocode: '["step 1", "step 2"]',
        testVectors: null,
      } as any);

      const report = await engine.validateAlgorithm('test-algo');
      
      expect(report.results.some(r => r.validationType === 'completeness_check')).toBe(true);
      expect(report.results.some(r => r.passed)).toBe(true);
    });
  });

  describe('validateAtom', () => {
    it('should return failure when atom not found', async () => {
      vi.mocked(mockStore.db.atom.findUnique).mockResolvedValue(null);

      const report = await engine.validateAtom('non-existent-id');
      
      expect(report.total).toBe(1);
      expect(report.passed).toBe(0);
      expect(report.failed).toBe(1);
    });

    it('should validate atom structure', async () => {
      vi.mocked(mockStore.db.atom.findUnique).mockResolvedValue({
        id: 'test-atom',
        elementName: 'Test Element',
        structure: { syntax: 'test' },
        targetId: 'test-target',
      } as any);

      const report = await engine.validateAtom('test-atom');
      
      expect(report.results.some(r => r.validationType === 'completeness_check')).toBe(true);
      expect(report.results.filter(r => r.passed).length).toBeGreaterThan(0);
    });
  });

  describe('executePythonCode', () => {
    it('should execute valid Python code successfully', async () => {
      const result = await engine.executePythonCode('print("Hello, World!")');
      
      expect(result.success).toBe(true);
      expect(result.output).toContain('Hello, World!');
    });

    it('should handle syntax errors', async () => {
      const result = await engine.executePythonCode('print("unclosed string');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle runtime errors', async () => {
      const result = await engine.executePythonCode('x = 1 / 0');
      
      expect(result.success).toBe(false);
    });

    it('should capture stdout', async () => {
      const result = await engine.executePythonCode(`
for i in range(3):
    print(f"Number: {i}")
`);
      
      expect(result.success).toBe(true);
      expect(result.output).toContain('Number: 0');
      expect(result.output).toContain('Number: 1');
      expect(result.output).toContain('Number: 2');
    });
  });

  describe('validateExample', () => {
    it('should return failure when example not found', async () => {
      vi.mocked(mockStore.db.example.findUnique).mockResolvedValue(null);

      const report = await engine.validateExample('non-existent-id');
      
      expect(report.total).toBe(1);
      expect(report.passed).toBe(0);
      expect(report.failed).toBe(1);
    });

    it('should execute Python examples', async () => {
      vi.mocked(mockStore.db.example.findUnique).mockResolvedValue({
        id: 'test-example',
        code: 'print("Test output")',
        language: 'python',
        expectedOutput: null,
      } as any);

      const report = await engine.validateExample('test-example');
      
      expect(report.results.some(r => r.validationType === 'code_execution')).toBe(true);
    });

    it('should validate expected output', async () => {
      vi.mocked(mockStore.db.example.findUnique).mockResolvedValue({
        id: 'test-example',
        code: 'print("Expected")',
        language: 'python',
        expectedOutput: 'Expected',
      } as any);

      const report = await engine.validateExample('test-example');
      
      expect(report.results.some(r => r.validationType === 'output_validation')).toBe(true);
    });
  });
});
