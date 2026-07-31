import Settings from "../../components/pages/Settings";
import { absoluteUrl } from "../../lib/seo";

export const metadata = {
  title: "Recorder Settings",
  description: "Einstellungen fuer Server-Verbindung, Login und Device-ID.",
  alternates: { canonical: absoluteUrl("/Settings/") },
  robots: { index: false, follow: false },
};

export default function Page() {
  return <Settings />;
}
