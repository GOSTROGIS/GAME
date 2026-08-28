window.HMKit = window.HMKit || {};

window.HMKit.TitleScreen = function TitleScreen({ onBegin }) {
  const { Button } = window.HollowMarch;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 20,
        display: "grid",
        placeItems: "center start",
        backgroundImage:
          "linear-gradient(90deg, rgba(5,8,10,.88) 0%, rgba(5,8,10,.46) 42%, rgba(5,8,10,.08) 72%), linear-gradient(0deg, rgba(5,7,9,.65), transparent 45%), url('../../../assets/concept/hollow-march-title.png')",
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}
    >
      <div style={{ marginLeft: "clamp(70px, 11vw, 210px)", animation: "titleIn 1.1s var(--ease-title) both" }}>
        <h1 style={{ margin: 0, color: "var(--bone-bright)", font: "var(--type-title)", letterSpacing: "var(--track-title)", textShadow: "var(--shadow-text)" }}>
          The Hollow <span style={{ color: "var(--gold-bright)", fontWeight: 400 }}>March</span>
        </h1>
        <p style={{ margin: "24px 0 34px", maxWidth: 340, color: "var(--bone-dim)", font: "var(--type-deck)" }}>
          The bells are rung to keep the names, not the hours.
        </p>
        <div style={{ width: 310, display: "grid", gap: 10 }}>
          <Button variant="primary" ornate onClick={onBegin}>Begin the March</Button>
          <Button variant="ghost">Continue</Button>
          <Button variant="ghost">Settings</Button>
        </div>
      </div>
      <p style={{ position: "absolute", right: 28, bottom: 20, margin: 0, color: "rgba(220,215,200,.48)", fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase" }}>
        Vertical slice &middot; prototype assets
      </p>
    </div>
  );
};
