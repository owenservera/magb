export enum GenerationPhase {
  LAYER_1 = "LAYER_1",
  LAYER_2 = "LAYER_2",
  LAYER_3 = "LAYER_3",
}

export interface GenerationTask {
  id: string;
  target: string;
  section: string;
  subsection?: string;
  phase: GenerationPhase;
  dependsOn: string[];
}

export class GenerationPlanner {
  static generateLayer1Tasks(target: string, targetType: string): GenerationTask[] {
    return [
      {
        id: `discover_capabilities_${target}`,
        target,
        section: "capabilities",
        phase: GenerationPhase.LAYER_1,
        dependsOn: [],
      },
      {
        id: `extract_coordinate_system_${target}`,
        target,
        section: "coordinate_system",
        phase: GenerationPhase.LAYER_1,
        dependsOn: [],
      },
      {
        id: `extract_minimal_file_${target}`,
        target,
        section: "minimal_file",
        phase: GenerationPhase.LAYER_1,
        dependsOn: [],
      },
    ];
  }

  static generateLayer2Tasks(target: string, capabilities: any[]): GenerationTask[] {
    const tasks: GenerationTask[] = [];

    for (const cap of capabilities) {
      tasks.push({
        id: `extract_template_${target}_${cap.id}`,
        target,
        section: "template",
        subsection: cap.id,
        phase: GenerationPhase.LAYER_2,
        dependsOn: [`discover_capabilities_${target}`],
      });

      tasks.push({
        id: `extract_algorithm_${target}_${cap.id}`,
        target,
        section: "algorithm",
        subsection: cap.id,
        phase: GenerationPhase.LAYER_2,
        dependsOn: [`discover_capabilities_${target}`],
      });
    }

    return tasks;
  }
}
