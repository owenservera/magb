import { PrismaClient, Prisma } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import "dotenv/config";

export class UniversalKnowledgeStore {
  public db: PrismaClient;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is missing in UniversalKnowledgeStore");
    }
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    
    this.db = new PrismaClient({ adapter, log: ['error', 'warn'] });
  }

  async disconnect() {
    await this.db.$disconnect();
  }

  // --- Graph Traversal ---

  async getNeighbors(
    nodeId: string,
    nodeType: string,
    relationship?: string,
    direction: 'outgoing' | 'incoming' | 'both' = 'outgoing'
  ) {
    const filters: any[] = [];
    
    if (direction === 'outgoing' || direction === 'both') {
      filters.push({
        sourceId: nodeId,
        sourceType: nodeType,
        ...(relationship && { relationType: relationship })
      });
    }

    if (direction === 'incoming' || direction === 'both') {
      filters.push({
        relTargetId: nodeId,
        relTargetType: nodeType,
        ...(relationship && { relationType: relationship })
      });
    }

    return this.db.relation.findMany({
      where: {
        OR: filters
      }
    });
  }

  // --- Statistics ---

  async getStatistics() {
    const targetCount = await this.db.target.count();
    const entryCount = await this.db.entry.count();
    const atomCount = await this.db.atom.count();
    const capabilityCount = await this.db.capability.count();
    const algorithmCount = await this.db.algorithm.count();
    const blueprintCount = await this.db.blueprint.count();
    const relationCount = await this.db.relation.count();

    const runs = await this.db.generationRun.aggregate({
      _sum: {
        totalCostUsd: true,
        totalApiCalls: true
      }
    });

    return {
      targets_documented: targetCount,
      total_entries: entryCount,
      total_atoms: atomCount,
      total_capabilities: capabilityCount,
      total_algorithms: algorithmCount,
      total_blueprints: blueprintCount,
      total_edges: relationCount,
      total_cost_usd: runs._sum.totalCostUsd || 0.0,
      total_api_calls: runs._sum.totalApiCalls || 0
    };
  }
}
