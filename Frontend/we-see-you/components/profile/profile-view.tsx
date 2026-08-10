import { fetchPoliticianById, fetchPoliticianFinance } from "@/lib/api";
import { ProfileTemplate } from "../templates";

interface ProfileViewProps {
  id: string;
}

export default async function ProfileView({ id }: ProfileViewProps) {
  let politician = null;
  let finance = null;
  let errorMsg: string | null = null;

  try {
    politician = await fetchPoliticianById(id);
  } catch (err: unknown) {
    console.error(err);
    errorMsg = err instanceof Error ? err.message : "Could not retrieve politician profile.";
  }

  if (politician) {
    try {
      finance = await fetchPoliticianFinance(id);
    } catch (err: unknown) {
      console.warn("Could not retrieve politician finance records:", err);
    }
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
