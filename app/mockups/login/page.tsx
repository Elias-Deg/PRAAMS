export default function LoginPage() {
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
        }}
      >
        <span
          style={{ color: "#ffffff", fontWeight: "bold", fontSize: "20px", letterSpacing: "1px" }}
        >
          PRAAMS
        </span>
      </header>

      {/* ── Main ── */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 16px",
        }}
      >
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            padding: "40px 36px",
            width: "100%",
            maxWidth: "380px",
          }}
        >
          <h1
            style={{
              fontSize: "20px",
              fontWeight: "bold",
              color: "#1F3864",
              marginBottom: "28px",
              textAlign: "center",
              margin: "0 0 28px 0",
            }}
          >
            Staff Login
          </h1>

          {/* Email */}
          <div style={{ marginBottom: "16px" }}>
            <label
              htmlFor="email"
              style={{ display: "block", fontSize: "13px", color: "#374151", marginBottom: "6px" }}
            >
              Email address
            </label>
            <input
              id="email"
              type="text"
              placeholder="Email address"
              readOnly
              style={{
                width: "100%",
                border: "1px solid #d1d5db",
                borderRadius: "3px",
                padding: "9px 12px",
                fontSize: "14px",
                color: "#9ca3af",
                backgroundColor: "#ffffff",
                boxSizing: "border-box",
                outline: "none",
              }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: "24px" }}>
            <label
              htmlFor="password"
              style={{ display: "block", fontSize: "13px", color: "#374151", marginBottom: "6px" }}
            >
              Password
            </label>
            <input
              id="password"
              type="text"
              placeholder="Password"
              readOnly
              style={{
                width: "100%",
                border: "1px solid #d1d5db",
                borderRadius: "3px",
                padding: "9px 12px",
                fontSize: "14px",
                color: "#9ca3af",
                backgroundColor: "#ffffff",
                boxSizing: "border-box",
                outline: "none",
              }}
            />
          </div>

          {/* Login button */}
          <button
            style={{
              width: "100%",
              backgroundColor: "#1F3864",
              color: "#ffffff",
              border: "none",
              borderRadius: "3px",
              padding: "11px 0",
              fontSize: "15px",
              fontWeight: "bold",
              cursor: "pointer",
              marginBottom: "14px",
              display: "block",
            }}
          >
            Login
          </button>

          {/* Forgot password */}
          <div style={{ textAlign: "center" }}>
            <span
              style={{
                fontSize: "13px",
                color: "#9ca3af",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Forgot password?
            </span>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer
        style={{ textAlign: "center", padding: "16px", color: "#9ca3af", fontSize: "12px" }}
      >
        Addis Ababa Private Clinics
      </footer>
    </div>
  );
}
