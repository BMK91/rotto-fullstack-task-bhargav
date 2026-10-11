import type { Metadata } from "next";

import { CandidateSearchWorkspace } from "@/features/candidate-search/components/candidate-search-workspace";

export const metadata: Metadata = {
  title: "Candidate Search | Rotto Recruiter",
  description: "Find candidates using a natural-language brief.",
};

export default function CandidateSearchPage() {
  return <CandidateSearchWorkspace />;
}
