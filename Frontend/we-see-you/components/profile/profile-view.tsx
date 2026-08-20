import {
  fetchPoliticianById,
  fetchPoliticianFinance,
  PoliticianDetail,
  FinanceSummary,
} from "@/lib/api";
import { ProfileTemplate } from "../templates";

interface ProfileViewProps {
  id: string;
}

export default async function ProfileView({ id }: ProfileViewProps) {
  let politician: PoliticianDetail | null = null;
  let finance: Record<string, FinanceSummary> | null = null;
  let errorMsg: string | null = null;

  const [profResult, finResult] = await Promise.allSettled([
    fetchPoliticianById(id),
    fetchPoliticianFinance(id),
  ]);

  if (profResult.status === "fulfilled") {
    politician = profResult.value;
  } else {
    console.error(profResult.reason);
    errorMsg =
      profResult.reason instanceof Error
        ? profResult.reason.message
        : "Could not retrieve politician profile.";
  }

  if (finResult.status === "fulfilled") {
    finance = finResult.value;
  } else {
    console.warn("Could not retrieve politician finance records:", finResult.reason);
  }

  return (
    <ProfileTemplate
      politician={politician}
      finance={finance}
      errorMsg={errorMsg}
      backLink="/"
      backLabel="Back to National Congress"
    />
  );
}
