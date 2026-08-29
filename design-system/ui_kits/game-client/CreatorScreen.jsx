window.HMKit = window.HMKit || {};

window.HMKit.CreatorScreen = function CreatorScreen({ onDone, onBack }) {
  const {
    Modal, StepDots, PortraitStage, PortraitCaption, FieldLabel, TextField,
    OptionCard, Button, StatusPill
  } = window.HollowMarch;

  const origins = [
    { id: "gloamfarer", title: "Gloamfarer", art: "../../../assets/characters/gloamfarer-v2.png",
      description: "You carried letters between settlements after the old roads learned to move. You know which milestones lie and which fires welcome no guest.", note: "+3 WAYFINDING · +2 FORAGING · +2 CAMPCRAFT" },
    { id: "bell_warden", title: "Bell Warden", art: "../../../assets/characters/bell-warden-v2.png",
      description: "You kept a plague bell ringing until there was nobody left to count its tolls. Its rope burned your palms, but its rhythm still steadies your heart.", note: "+3 MACES · +2 WARDING · +2 FIRST AID" },
    { id: "grave_tithe_runner", title: "Grave-Tithe Runner", art: null,
      description: "You smuggled names off the burial rolls so poor families could keep their dead. The Tithe remembers your face even if the law does not.", note: "+3 LIGHT BLADES · +2 SKULDUGGERY · +2 BARGAINING" },
    { id: "mire_physicker", title: "Mire Physicker", art: "../../../assets/characters/mire-physicker-v2.png",
      description: "The black fen taught you that poison and medicine differ mostly in patience. Your remedies work, though sensible folk dislike watching them work.", note: "+3 ALCHEMY · +3 HERBALISM · +1 FIRST AID" },
    { id: "oathless_scion", title: "Oathless Scion", art: "../../../assets/characters/oathless-scion-v2.png",
      description: "Your house purchased loyalty with beautiful promises and uglier collateral. You left the signet behind, but courtly habits cling more tightly than rings.", note: "+3 DUELING · +3 RHETORIC · +1 LORE" },
    { id: "cinder_mason", title: "Cinder Mason", art: null,
      description: "You repaired the foundations of a city that was burning from below. Stone speaks under a hammer; you heard it beg and kept working.", note: "+3 HEAVY ARMS · +2 SMITHING · +2 MASONRY" },
    { id: "starved_seer", title: "Starved Seer", art: null,
      description: "You fasted for a revelation and something answered from the space where a god should have been. Hunger keeps the memory sharp.", note: "+3 DIVINATION · +3 RITES · +1 LORE" },
    { id: "thorn_poacher", title: "Thorn Poacher", art: null,
      description: "When winter law forbade hunting, you fed a village from a forest that hunted back. Some nights you still hear antlers scraping at the shutters.", note: "+3 ARCHERY · +2 TRAPPING · +2 TRACKING" }
  ];

  const [pick, setPick] = React.useState("gloamfarer");
  const chosen = origins.find(function (o) { return o.id === pick; });

  return (
    <Modal labelledBy="creator-title" style={{ display: "grid", gridTemplateRows: "var(--modal-header-h) 1fr var(--modal-footer-h)" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 34px", borderBottom: "1px solid var(--line)" }}>
        <h2 id="creator-title" style={{ margin: 0, font: "var(--type-h2-modal)", letterSpacing: ".02em", color: "var(--bone)" }}>Forge a Pilgrim</h2>
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

          <fieldset style={{ minWidth: 0, margin: "18px 0 0", padding: 0, border: 0 }}>
          <legend style={{ marginBottom: 8, color: "var(--gold)", font: "var(--type-micro)", letterSpacing: "var(--track-micro)", textTransform: "uppercase" }}>Chosen Origin</legend>
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
          </fieldset>
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
