const fieldStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #d1d5db",
  borderRadius: "3px",
  padding: "10px 14px",
  fontSize: "14px",
  color: "#374151",
  backgroundColor: "#ffffff",
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "13px",
  color: "#374151",
  marginBottom: "6px",
  fontWeight: "500",
};

export default function BookingPage() {
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
      <main style={{ flex: 1, padding: "36px 48px" }}>
        <h1
          style={{
            fontSize: "22px",
            fontWeight: "bold",
            color: "#1F3864",
            margin: "0 0 28px 0",
          }}
        >
          Schedule Appointment
        </h1>

        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            padding: "32px 28px",
            maxWidth: "560px",
          }}
        >
          {/* Patient field */}
          <div style={{ marginBottom: "18px" }}>
            <label style={labelStyle}>Patient</label>
            <div style={fieldStyle}>
              <span>Selam Tesfaye (P-0198)</span>
            </div>
          </div>

          {/* Healthcare Professional dropdown */}
          <div style={{ marginBottom: "18px" }}>
            <label style={labelStyle}>Healthcare Professional</label>
            <div style={{ ...fieldStyle, color: "#9ca3af" }}>
              <span>Healthcare Professional</span>
              <span>▾</span>
            </div>
          </div>

          {/* Date field */}
          <div style={{ marginBottom: "28px" }}>
            <label style={labelStyle}>Date</label>
            <div style={fieldStyle}>
              <span>24 / 08 / 2026</span>
            </div>
          </div>

          {/* Available Time Slots */}
          <p
            style={{
              fontSize: "13px",
              fontWeight: "bold",
              color: "#1F3864",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              margin: "0 0 12px 0",
            }}
          >
            Available Time Slots
          </p>
          <div style={{ display: "flex", gap: "10px", marginBottom: "24px", flexWrap: "wrap" }}>
            {/* 09:00 */}
            <div
              style={{
                border: "1px solid #1F3864",
                borderRadius: "3px",
                padding: "8px 18px",
                fontSize: "14px",
                color: "#1F3864",
                cursor: "pointer",
                backgroundColor: "#ffffff",
              }}
            >
              09:00
            </div>
            {/* 09:30 */}
            <div
              style={{
                border: "1px solid #1F3864",
                borderRadius: "3px",
                padding: "8px 18px",
                fontSize: "14px",
                color: "#1F3864",
                cursor: "pointer",
                backgroundColor: "#ffffff",
              }}
            >
              09:30
            </div>
            {/* 10:00 (booked) */}
            <div
              style={{
                border: "1px solid #d1d5db",
                borderRadius: "3px",
                padding: "8px 18px",
                fontSize: "14px",
                color: "#9ca3af",
                cursor: "not-allowed",
                backgroundColor: "#f3f4f6",
              }}
            >
              10:00 (booked)
            </div>
            {/* 10:30 */}
            <div
              style={{
                border: "1px solid #1F3864",
                borderRadius: "3px",
                padding: "8px 18px",
                fontSize: "14px",
                color: "#1F3864",
                cursor: "pointer",
                backgroundColor: "#ffffff",
              }}
            >
              10:30
            </div>
          </div>

          {/* Reason for visit */}
          <div style={{ marginBottom: "28px" }}>
            <label htmlFor="reason" style={labelStyle}>
              Reason for visit
            </label>
            <textarea
              id="reason"
              readOnly
              placeholder="Reason for visit"
              rows={4}
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
                resize: "none",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Confirm Booking button */}
          <button
            style={{
              width: "100%",
              backgroundColor: "#7f1d1d",
              color: "#ffffff",
              border: "none",
              borderRadius: "3px",
              padding: "12px 0",
              fontSize: "15px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Confirm Booking
          </button>
        </div>
      </main>
    </div>
  );
}
