window.HMKit = window.HMKit || {};

window.HMKit.CreatorScreen = function CreatorScreen({ onDone, onBack }) {
  const {
    Modal, StepDots, PortraitStage, PortraitCaption, FieldLabel, TextField,
    OptionCard, Button, StatusPill
  } = window.HollowMarch;

  const origins = [
    { id: "gloam", title: "Gloamfarer", art: "../../../assets/characters/gloamfarer-v2.png",
      description: "You walked the dark roads before they had names. Wayfaring comes easily; company does not.", note: "+2 WAYFARING" },
    { id: "bell", title: "Bell-Warden", art: "../../../assets/characters/bell-warden-v2.png",
      description: "You kept the names in the tower. The bells still wake you.", note: "+2 PRESENCE" },
    { id: "mire", title: "Mire-Physicker", art: "../../../assets/characters/mire-physicker-v2.png",
      description: "You treated the drowned parish through three floods.", note: "+2 ALCHEMY" },
    { id: "scion", title: "Oathless Scion", art: "../../../assets/characters/oathless-scion-v2.png",
      description: "Your house swore nothing and kept nothing. You inherited the debt anyway.", note: "+2 WILL" },
    { id: "ash", title: "Ash-Reckoner", art: null,
      description: "You counted what the foundry burned. No keyframe exists for this origin.", note: "ART PENDING" },
    { id: "salt", title: "Salt-Widow", art: null,
      description: "You buried a household under the waste. No keyframe exists for this origin.", note: "ART PENDING" }
  ];

  const [pick, setPick] = React.useState("gloam");
  const chosen = origins.find(function (o) { return o.id === pick; });

  return (
    <Modal style={{ display: "grid", gridTemplateRows: "var(--modal-header-h) 1fr var(--modal-footer-h)" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 34px", borderBottom: "1px solid var(--line)" }}>
        <h2 style={{ margin: 0, font: "var(--type-h2-modal)", letterSpacing: ".02em", color: "var(--bone)" }}>Forge a Pilgrim</h2>
        <StepDots count={6} active={0} />
      </header>

      <div style={{ minHeight: 0, display: "grid", gridTemplateColumns: "minmax(330px, 38%) 1fr" }}>
        <PortraitStage image={chosen.art || undefined} alt={chosen.title}>
          {!chosen.art ? (
            <div style={{ display: "grid", gap: 10, placeItems: "center", padding: 24, textAlign: "center" }}>
              <StatusPill tone="prototype">No keyframe</StatusPill>
              <p style={{ margin: 0, maxWidth: 220, color: "var(--muted)", font: "13px/1.5 var(--serif)" }}>
                Four of the eight origins have renders. This alcove stays empty rather than borrowing another origin&rsquo;s art.
              </p>
            </div>
          ) : null}
          <PortraitCaption name={chosen.title} note={chosen.art ? "keyframe, not final art" : "awaiting art"} />
        </PortraitStage>

        <div style={{ overflow: "auto", padding: "34px clamp(30px, 4vw, 68px)", scrollbarColor: "var(--scroll-thumb) transparent" }}>
          <p style={{ maxWidth: 650, margin: 0, color: "#a7aaa4", font: "var(--type-intro)" }}>
            Attributes define potential and resources. Skills record behaviour. Choose what you intend to become, not what you intend to carry.
          </p>

          <FieldLabel htmlFor="pilgrim-name">Pilgrim&rsquo;s Name</FieldLabel>
          <TextField id="pilgrim-name" value="Aszelin" onChange={function () {}} />

          <FieldLabel>Chosen Origin</FieldLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(210px, 1fr))", gap: 10 }}>
            {origins.map(function (o) {
              return (
                <OptionCard
                  key={o.id}
                  selected={pick === o.id}
                  onClick={function () { setPick(o.id); }}
                  title={o.title}
                  description={o.description}
                  note={o.note}
                />
              );
            })}
          </div>
        </div>
      </div>

      <footer style={{ display: "grid", gridTemplateColumns: "140px 1fr 160px", alignItems: "center", gap: 20, padding: "0 28px", borderTop: "1px solid var(--line)" }}>
        <Button variant="ghost" onClick={onBack}>Back</Button>
        <span style={{ color: "#818985", textAlign: "center", font: "italic 14px var(--serif)" }}>
          Stage 1 of 6 &mdash; identity
        </span>
        <Button variant="primary" onClick={onDone}>Next</Button>
      </footer>
    </Modal>
  );
};
