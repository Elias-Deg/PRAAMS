export default function SearchPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f3f4f6",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      {/* ── Header ── */}
      <header
        style={{
          backgroundColor: "#1F3864",
          padding: "0 32px",
          height: "56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{ color: "#ffffff", fontWeight: "bold", fontSize: "20px", letterSpacing: "1px" }}
        >
          PRAAMS
        </span>
        <span style={{ color: "#ffffff", fontSize: "14px", cursor: "pointer" }}>
          Healthcare Professional ▾
        </span>
      </header>

      {/* ── Main ── */}
      <main style={{ flex: 1, padding: "36px 48px" }}>

        {/* Search bar */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "28px", maxWidth: "700px" }}>
          <input
            id="search"
            type="text"
            placeholder="Search by name, ID, or phone…"
            readOnly
            style={{
              flex: 1,
              border: "1px solid #d1d5db",
              borderRadius: "3px",
              padding: "9px 14px",
              fontSize: "14px",
              color: "#9ca3af",
              backgroundColor: "#ffffff",
              outline: "none",
            }}
          />
          <button
            style={{
              backgroundColor: "#1F3864",
              color: "#ffffff",
              border: "none",
              borderRadius: "3px",
              padding: "9px 24px",
              fontSize: "14px",
              fontWeight: "bold",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Search
          </button>
        </div>

        {/* Results table */}
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            overflow: "hidden",
            maxWidth: "700px",
            marginBottom: "28px",
          }}
        >
          {/* Table header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 2fr",
              backgroundColor: "#f9fafb",
              borderBottom: "1px solid #d1d5db",
              padding: "10px 16px",
            }}
          >
            {["Patient", "ID", "Phone"].map((h) => (
              <span
                key={h}
                style={{ fontSize: "12px", fontWeight: "bold", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}
              >
                {h}
              </span>
            ))}
          </div>

          {/* Row 1 – Abebe Kebede (unselected) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 2fr",
              padding: "11px 16px",
              borderBottom: "1px solid #f3f4f6",
              backgroundColor: "#ffffff",
            }}
          >
            <span style={{ fontSize: "14px", color: "#111827" }}>Abebe Kebede</span>
            <span style={{ fontSize: "14px", color: "#374151" }}>P-0231</span>
            <span style={{ fontSize: "14px", color: "#374151" }}>09xx xxx xxx</span>
          </div>

          {/* Row 2 – Selam Tesfaye (selected / highlighted green) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 2fr",
              padding: "11px 16px",
              backgroundColor: "#dcfce7",
            }}
          >
            <span style={{ fontSize: "14px", color: "#111827", fontWeight: "500" }}>Selam Tesfaye</span>
            <span style={{ fontSize: "14px", color: "#374151" }}>P-0198</span>
            <span style={{ fontSize: "14px", color: "#374151" }}>09xx xxx xxx</span>
          </div>
        </div>

        {/* Selected patient summary panel */}
        <div
          style={{
            backgroundColor: "#f9fafb",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            padding: "24px 28px",
            maxWidth: "700px",
          }}
        >
          {/* Patient header */}
          <p style={{ margin: "0 0 18px 0", fontSize: "15px", color: "#111827" }}>
            <strong>Selam Tesfaye</strong>
            {" — "}
            <span style={{ color: "#374151" }}>P-0198, Female, DOB 12/03/1990</span>
          </p>

          {/* Medical History */}
          <p
            style={{
              margin: "0 0 10px 0",
              fontSize: "13px",
              fontWeight: "bold",
              color: "#1F3864",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Medical History
          </p>
          <ul style={{ margin: 0, paddingLeft: "18px" }}>
            <li style={{ fontSize: "14px", color: "#374151", marginBottom: "6px" }}>
              14/07/2026 — Follow-up, Dr. Kassa
            </li>
            <li style={{ fontSize: "14px", color: "#374151" }}>
              02/05/2026 — Initial consultation, Dr. Kassa
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
