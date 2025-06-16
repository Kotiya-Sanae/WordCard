import { StatsSummary } from "@/components/stats/StatsSummary";
import { MasteryPieChart } from "@/components/stats/MasteryPieChart";

export default function StatsPage() {
  return (
    <div>
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold text-center">学习统计</h1>
      </div>
      <div className="p-4 space-y-4">
        <StatsSummary />
        <MasteryPieChart />
      </div>
    </div>
  );
}