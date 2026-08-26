const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #d1d5db",
  borderRadius: "3px",
  padding: "9px 12px",
  fontSize: "14px",
  color: "#374151",
  backgroundColor: "#ffffff",
  boxSizing: "border-box",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "13px",
  color: "#374151",
  marginBottom: "6px",
  fontWeight: "500",
};

export default function RegisterPage() {
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
          Receptionist ▾
        </span>
      </header>

      {/* ── Main ── */}
      <main style={{ flex: 1, padding: "36px 48px", maxWidth: "860px" }}>
        <h1
          style={{
            fontSize: "22px",
            fontWeight: "bold",
            color: "#1F3864",
            margin: "0 0 28px 0",
          }}
        >
          Register New Patient
        </h1>

        {/* Form */}
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            padding: "32px 28px",
          }}
        >
          {/* 2-column grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px 28px",
              marginBottom: "20px",
            }}
          >
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" style={labelStyle}>
                Full Name
              </label>
              <input id="fullName" type="text" placeholder="Full Name" readOnly style={inputStyle} />
            </div>

            {/* Date of Birth */}
            <div>
              <label htmlFor="dob" style={labelStyle}>
                Date of Birth
              </label>
              <input id="dob" type="text" placeholder="DD / MM / YYYY" readOnly style={inputStyle} />
            </div>

            {/* Gender */}
            <div>
              <label htmlFor="gender" style={labelStyle}>
                Gender
              </label>
              <div
                style={{
                  ...inputStyle,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  color: "#9ca3af",
                }}
              >
                <span>Gender</span>
                <span>▾</span>
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phone" style={labelStyle}>
                Phone Number
              </label>
              <input
                id="phone"
                type="text"
                placeholder="Phone Number"
                readOnly
                style={inputStyle}
              />
            </div>
          </div>

          {/* Address – full width */}
          <div style={{ marginBottom: "20px" }}>
            <label htmlFor="address" style={labelStyle}>
              Address
            </label>
            <input
              id="address"
              type="text"
              placeholder="Address"
              readOnly
              style={inputStyle}
            />
          </div>

          {/* Emergency Contact – full width */}
          <div style={{ marginBottom: "32px" }}>
            <label htmlFor="emergency" style={labelStyle}>
              Emergency Contact
            </label>
            <input
              id="emergency"
              type="text"
              placeholder="Emergency Contact"
              readOnly
              style={inputStyle}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: "14px", justifyContent: "flex-end" }}>
            <button
              style={{
                padding: "10px 28px",
                backgroundColor: "#e5e7eb",
                color: "#374151",
                border: "1px solid #d1d5db",
                borderRadius: "3px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              style={{
                padding: "10px 28px",
                backgroundColor: "#166534",
                color: "#ffffff",
                border: "none",
                borderRadius: "3px",
                fontSize: "14px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Save Patient
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
