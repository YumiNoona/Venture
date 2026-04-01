import { requireUser } from "@/lib/getUser";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const { dbUser, authUser } = await requireUser();

  return <SettingsClient dbUser={dbUser} authUser={authUser} />;
}
