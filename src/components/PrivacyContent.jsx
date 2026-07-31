export default function PrivacyContent({ doc }) {
  return (
    <article className="legal-content max-w-3xl mx-auto px-6 sm:px-10 py-16">
      <h1>{doc.title}</h1>
      <p className="text-sm text-ink-muted mt-1 mb-6 font-mono">{doc.updated}</p>
      <p>{doc.intro}</p>
      {doc.sections.map((s) => (
        <section key={s.h}>
          <h2>{s.h}</h2>
          {s.b.split("\n\n").map((para, i) => (
            <p key={i} style={{ whiteSpace: "pre-line" }}>{para}</p>
          ))}
        </section>
      ))}
    </article>
  );
}
