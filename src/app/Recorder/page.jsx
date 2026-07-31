import Recorder from "../../components/pages/Recorder";
import { absoluteUrl } from "../../lib/seo";

export const metadata = {
  title: "Recorder",
  description: "Mobile Audio-Aufnahme mit lokaler Upload-Warteschlange.",
  alternates: { canonical: absoluteUrl("/Recorder/") },
  robots: { index: false, follow: false },
};

export default function Page() {
  return <Recorder />;
}
