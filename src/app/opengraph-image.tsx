import { ImageResponse } from "next/og";

export const alt = "Atlora Knowledge Starfield";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#111111",
          color: "#f1f1ef",
          display: "flex",
          height: "100%",
          overflow: "hidden",
          padding: "72px 84px",
          position: "relative",
          width: "100%"
        }}
      >
        <div style={{ border: "1px solid #303030", borderRadius: 520, height: 520, position: "absolute", right: -150, top: 55, width: 520 }} />
        <div style={{ border: "1px solid #2b2b2b", borderRadius: 390, height: 390, position: "absolute", right: -85, top: 120, width: 390 }} />
        <div style={{ background: "#4f6f8f", borderRadius: 110, boxShadow: "0 0 70px rgba(79,111,143,0.22)", height: 110, position: "absolute", right: 86, top: 258, width: 110 }} />
        <div style={{ background: "#b48745", borderRadius: 18, height: 18, position: "absolute", right: 330, top: 122, width: 18 }} />
        <div style={{ background: "#9a554b", borderRadius: 12, height: 12, position: "absolute", right: 210, top: 520, width: 12 }} />

        <div style={{ display: "flex", flexDirection: "column", maxWidth: 760, position: "relative" }}>
          <div style={{ alignItems: "center", display: "flex", marginBottom: 66 }}>
            <div style={{ alignItems: "center", background: "#e7e7e3", borderRadius: 40, display: "flex", height: 56, justifyContent: "center", marginRight: 18, position: "relative", width: 56 }}>
              <div style={{ background: "#191919", borderRadius: 15, height: 30, width: 30 }} />
              <div style={{ background: "#b48745", borderRadius: 7, height: 9, position: "absolute", right: 5, top: 4, width: 9 }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 28, fontWeight: 700 }}>Atlora</div>
              <div style={{ color: "#9b9b97", fontSize: 16 }}>Knowledge Starfield</div>
            </div>
          </div>

          <div style={{ color: "#f3f3f1", display: "flex", flexDirection: "column", fontSize: 54, fontWeight: 700, lineHeight: 1.1 }}>
            <span>AI Article Summarizer</span>
            <span>&amp; Knowledge Card Generator</span>
          </div>
          <div style={{ color: "#aaa9a6", fontSize: 22, lineHeight: 1.45, marginTop: 28 }}>
            Turn links, text, and images into structured knowledge you can revisit.
          </div>
        </div>
      </div>
    ),
    size
  );
}
