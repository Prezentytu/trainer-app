"use client";

import PlanBuilder from "@/components/plan-builder/PlanBuilder";
import { PageHeader } from "@/components/ui";

export default function NewPlanPage() {
  return (
    <div>
      <PageHeader title="Nowy plan" subtitle="Złóż plan z ćwiczeń biblioteki i ustaw parametry" />
      <PlanBuilder />
    </div>
  );
}
