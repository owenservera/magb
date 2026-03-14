import { PrismaClient } from '@prisma/client';
import { analyzeCoverage } from './coverage-analyzer';
import { buildMasterPlan } from './planning-engine';
import { executePlan } from './execution-engine';

const prisma = new PrismaClient();

async function runSingleCallTest() {
  console.log(`\n======================================================`);
  console.log(`🧪 Testing Full Pipeline (Restricted to 1 API Call)`);
  console.log(`======================================================\n`);

  const targetId = 'test_lang_pipeline';

  try {
    // 1. Ensure a dummy target exists for testing
    await prisma.target.upsert({
      where: { id: targetId },
      update: {},
      create: {
        id: targetId,
        name: 'Test Language',
        kind: 'PROGRAMMING_LANGUAGE',
        description: 'A test target to verify the intelligent pipeline.',
      }
    });

    // 2. Run coverage analysis
    console.log(`🔍 Step 1: Analyzing existing coverage...`);
    const coverageReport = await analyzeCoverage(targetId);

    // 3. Build the master plan
    console.log(`🧠 Step 2: Building Master Plan...`);
    const planResult = await buildMasterPlan(targetId, coverageReport);
    
    // 4. Force the budget to be extremely low so it only runs exactly ONE API call.
    // The first call will pass the budget check (0 < 0.00001). 
    // After 1 call, cost > 0.00001, so the next iteration will throw BudgetExhaustedError.
    await prisma.masterPlan.update({
      where: { id: planResult.planId },
      data: { maxBudgetUsd: 0.00001 } // Less than a fraction of a cent
    });

    console.log(`   - Master plan created! Total work items planned: ${planResult.totalWorkItems}`);
    console.log(`   - Budget restricted to $0.00001 to force stopping after 1 call.`);

    // 5. Execute the plan
    console.log(`\n⚙️ Step 3: Executing Master Plan... (Waiting for LLM response)`);
    await executePlan(planResult.planId);

  } catch (error: any) {
    if (error.name === 'BudgetExhaustedError') {
      console.log(`\n✅ TEST PASSED: Pipeline successfully stopped after exactly ONE API call due to budget constraints.`);
      
      // Let's verify the output in the database
      const completedItem = await prisma.workItem.findFirst({
        where: { targetId: undefined }, // workItem doesn't have targetId directly, sort by completion
        orderBy: { completedAt: 'desc' },
        take: 1
      });

      if (completedItem) {
         console.log(`\n📄 Data generated from the single API call:`);
         console.log(`   Phase Executed : ${completedItem.phase}`);
         console.log(`   Entity Type    : ${completedItem.entityType}`);
         console.log(`   Cost Incurred  : $${completedItem.costUsd?.toFixed(6)}`);
         console.log(`   Tokens Used    : ${completedItem.inputTokens} IN / ${completedItem.outputTokens} OUT`);
         console.log(`   Model Used     : ${completedItem.assignedModel}`);
         
         const parsed = completedItem.parsedData as any;
         if (parsed) {
           console.log(`\n   Extracted JSON Structure Keys: ${Object.keys(parsed).join(', ')}`);
           console.log(`   Raw Output Snippet:\n   ${completedItem.rawResponse?.substring(0, 300)}...`);
         } else {
           console.log(`\n   Parse Strategy : ${completedItem.parseStrategy}`);
           console.log(`   Raw Output:\n   ${completedItem.rawResponse}`);
         }
      }
    } else {
      console.error(`\n❌ Pipeline Failed unexpectedly:`, error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

runSingleCallTest().catch(console.error);
