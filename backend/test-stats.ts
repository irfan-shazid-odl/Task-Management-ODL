import { getDashboardStats, getProjectsStats } from './src/modules/stats/stats.service.js';

async function run() {
  console.log("Testing dashboard stats...");
  const dStats = await getDashboardStats();
  console.log(dStats);
  
  console.log("Testing projects stats...");
  const pStats = await getProjectsStats();
  console.log(pStats);
}

run().then(() => {
  console.log("Done");
  process.exit(0);
}).catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
