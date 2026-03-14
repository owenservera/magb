import { describe, it, expect, beforeEach } from 'vitest';
import { GenerationPlanner, GenerationPhase } from './planner';

describe('GenerationPlanner', () => {
  describe('generateLayer1Tasks', () => {
    it('should generate 3 Layer 1 tasks', () => {
      const tasks = GenerationPlanner.generateLayer1Tasks('json', 'DATA_FORMAT');
      
      expect(tasks).toHaveLength(3);
      expect(tasks.map(t => t.section)).toEqual([
        'capabilities',
        'coordinate_system',
        'minimal_file'
      ]);
    });

    it('should set correct phase for all tasks', () => {
      const tasks = GenerationPlanner.generateLayer1Tasks('json', 'DATA_FORMAT');
      
      tasks.forEach(task => {
        expect(task.phase).toBe(GenerationPhase.LAYER_1);
      });
    });

    it('should have no dependencies for Layer 1 tasks', () => {
      const tasks = GenerationPlanner.generateLayer1Tasks('json', 'DATA_FORMAT');
      
      tasks.forEach(task => {
        expect(task.dependsOn).toEqual([]);
      });
    });

    it('should generate unique task IDs', () => {
      const tasks = GenerationPlanner.generateLayer1Tasks('json', 'DATA_FORMAT');
      const ids = tasks.map(t => t.id);
      
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('generateLayer2Tasks', () => {
    const mockCapabilities = [
      { id: 'parse', name: 'Parse JSON' },
      { id: 'stringify', name: 'Stringify JSON' },
    ];

    it('should generate 2 tasks per capability', () => {
      const tasks = GenerationPlanner.generateLayer2Tasks('json', mockCapabilities);
      
      expect(tasks).toHaveLength(4); // 2 capabilities × 2 tasks each
    });

    it('should generate template and algorithm tasks', () => {
      const tasks = GenerationPlanner.generateLayer2Tasks('json', mockCapabilities);
      
      const sections = tasks.map(t => t.section);
      expect(sections.filter(s => s === 'template').length).toBe(2);
      expect(sections.filter(s => s === 'algorithm').length).toBe(2);
    });

    it('should set correct dependencies', () => {
      const tasks = GenerationPlanner.generateLayer2Tasks('json', mockCapabilities);
      
      tasks.forEach(task => {
        expect(task.dependsOn).toEqual(['discover_capabilities_json']);
      });
    });

    it('should include subsection for each capability', () => {
      const tasks = GenerationPlanner.generateLayer2Tasks('json', mockCapabilities);
      
      const subsections = tasks.map(t => t.subsection);
      expect(subsections).toContain('parse');
      expect(subsections).toContain('stringify');
    });
  });
});
