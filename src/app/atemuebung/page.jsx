import AtemuebungPage from "../../components/pages/Atemuebung";
import { buildMetadata } from "../../lib/seo";

export const metadata = buildMetadata({
  title: "HRV-Atemuebung",
  description:
    "Interaktive HRV-Atemuebung mit visueller Fuehrung, Sweep-Modus und einstellbarer Atemfrequenz.",
  path: "/atemuebung/",
  lang: "de",
  ogImage: "/atemuebung/og-1200x627.png",
});

export default function Page() {
  return <AtemuebungPage />;
}
