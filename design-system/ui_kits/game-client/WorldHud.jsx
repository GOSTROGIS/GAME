window.HMKit = window.HMKit || {};

window.HMKit.WorldHud = function WorldHud({ panel, onPanel, onTalk, children }) {
  const {
    Grain, Vignette, PlayerCard, TargetCard, LocationCard, QuestTracker,
    SideNav, ActionBar, HintStrip, InteractionPrompt, GamePanel,
    SkillTile, EnemyCodexCard, StatusPill, LockedLore, CodexBack
  } = window.HollowMarch;

  const nav = [
    { id: "pack", icon: "pack", label: "Pack", key: "I" },
    { id: "skills", icon: "skills", label: "Skills", key: "K" },
    { id: "journal", icon: "journal", label: "Journal", key: "J" },
    { id: "bestiary", icon: "bestiary", label: "Bestiary", key: "B" },
    { id: "atlas", icon: "atlas", label: "Atlas", key: "M" }
  ];

  const skills = [
    ["Swordsmanship", 38, "swordsmanship", 44], ["Heavy Arms", 21, "heavy_arms", 12], ["Marksmanship", 30, "marksmanship", 71],
    ["Guard", 26, "guard", 33], ["Vitality", 34, "vitality", 58], ["Hexcraft", 12, "hexcraft", 8],
    ["Mining", 44, "mining", 62], ["Smithing", 41, "smithing", 27], ["Wayfaring", 27, "wayfaring", 18]
  ];

  const beasts = [
    { rank: "Elite \u00B7 Controller", region: "Dunmire Causeway", name: "Parish Drowner",
      description: "Waterlogged tissue, collapsed sinuses, and a gait that favours the flooded side. It listens for bells and moves against them.",
      facts: [{ term: "Family", value: "Drowned" }, { term: "Role", value: "Controller" }] },
    { rank: "Regular \u00B7 Swarm", region: "Graven March", name: "Cairn-Chewer",
      description: "Jaw musculature overdeveloped past the skull's capacity. Travels in nines and eats the markers off graves.",
      facts: [{ term: "Family", value: "Carrion" }, { term: "Role", value: "Swarm" }] }
  ];

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "var(--shell)" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "linear-gradient(rgba(6,10,11,.45), rgba(6,10,11,.72)), url('../../../assets/world/hearthmere-hold.png')",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      />
      <Vignette />
      <Grain />

      <div style={{ position: "absolute", inset: 0, zIndex: 5, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "var(--hud-top)", left: "var(--hud-gutter)", right: "var(--hud-gutter)", display: "grid", gridTemplateColumns: "var(--hud-col-side) 1fr var(--hud-col-side)", alignItems: "start" }}>
          <div style={{ pointerEvents: "auto" }}>
            <PlayerCard name="Aszelin" level={14} rune="A" portrait="../../../assets/characters/gloamfarer-v2.png"
              health={{ value: 72, max: 100 }} stamina={{ value: 48, max: 100 }} focus={{ value: 86, max: 100 }} />
          </div>
          <div style={{ justifySelf: "center", pointerEvents: "auto" }}>
            <TargetCard role="Elite &middot; Controller" name="Parish Drowner" health={{ value: 340, max: 520 }} />
          </div>
          <div style={{ justifySelf: "end" }}>
            <LocationCard region="Hearthmere Hold" name="The Ember Ledger" note="Warmth is counted here, and charged for." />
          </div>
        </div>

        <div style={{ position: "absolute", left: "var(--hud-gutter)", top: "var(--nav-top)", pointerEvents: "auto" }}>
          <SideNav items={nav} active={panel} onSelect={onPanel} />
        </div>

        <div style={{ position: "absolute", right: "var(--hud-gutter)", top: "var(--tracker-top)", pointerEvents: "auto" }}>
          <QuestTracker chapter="Chapter II" title="The Unquenched Blade" progress={0.5}
            summary="Orik will not forge what he owes until the cairn is warm."
            objectives={[{ label: "Recover the blade", done: true }, { label: "Lay it at the Warm Cairn" }, { label: "Return to Orik" }]} />
        </div>

        {panel ? (
          <div style={{ position: "absolute", left: "var(--panel-left)", top: "var(--panel-top)", bottom: "var(--panel-bottom)", width: "var(--panel-w)", minWidth: "var(--panel-min-w)", pointerEvents: "auto" }}>
            <GamePanel title={panel === "skills" ? "Disciplines" : panel === "bestiary" ? "Bestiary" : "Pack"} onClose={function () { onPanel(null); }} style={{ height: "100%" }}>
              {panel === "skills" ? (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18, paddingBottom: 16, borderBottom: "1px solid var(--line)" }}>
                    <b style={{ font: "500 34px var(--display)", color: "var(--gold-bright)" }}>18</b>
                    <span style={{ color: "#8c938e", font: "13px var(--serif)" }}>independent disciplines, level 1 to 99. Skills record behaviour, not intent.</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                    {skills.map(function (s) {
                      return <SkillTile key={s[0]} name={s[0]} level={s[1]} icon={s[2]} xpPct={s[3]} />;
                    })}
                  </div>
                </div>
              ) : panel === "bestiary" ? (
                <div>
                  <CodexBack label="All families" />
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 9 }}>
                    {beasts.map(function (b) {
                      return (
                        <EnemyCodexCard key={b.name} rank={b.rank} region={b.region} name={b.name} description={b.description} facts={b.facts}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, margin: "7px 0" }}>
                            <StatusPill>Authored</StatusPill>
                            <StatusPill tone="valid">Habitat valid</StatusPill>
                            <StatusPill tone="prototype">Prototype</StatusPill>
                          </div>
                          <LockedLore>Codex reveal 2 of 4 locked</LockedLore>
                        </EnemyCodexCard>
                      );
                    })}
                  </div>
                  <p style={{ margin: "16px 0 0", color: "var(--muted)", font: "13px/1.55 var(--serif)" }}>
                    178 creatures across 21 ecological families. All authored and habitat-valid; none have production models.
                  </p>
                </div>
              ) : (
                <p style={{ margin: 0, color: "var(--muted)", font: "14px/1.5 var(--serif)" }}>
                  The pack uses the same panel shell. Not duplicated in this kit.
                </p>
              )}
            </GamePanel>
          </div>
        ) : null}

        {!panel && onTalk ? (
          <div style={{ position: "absolute", left: "50%", bottom: 128, transform: "translateX(-50%)", pointerEvents: "auto" }}>
            <button type="button" onClick={onTalk} style={{ padding: 0, border: 0, background: "none", cursor: "pointer" }}>
              <InteractionPrompt keyLabel="E">Speak with the Vessel-Keeper</InteractionPrompt>
            </button>
          </div>
        ) : null}

        <div style={{ position: "absolute", left: "50%", bottom: "var(--bottom-hud-offset)", transform: "translateX(-50%)", display: "grid", justifyItems: "center", gap: 7, pointerEvents: "auto" }}>
          <ActionBar slots={[
            { id: "light", icon: "swordsmanship", label: "Light", key: "1" },
            { id: "heavy", icon: "heavy_arms", label: "Heavy", key: "2" },
            { id: "guard", icon: "guard", label: "Guard", key: "3" },
            { id: "flask", icon: "flask", label: "Flask", key: "4", count: 3 }
          ]} />
          <HintStrip hints={[{ key: "E", label: "Use" }, { key: "K", label: "Skills" }, { key: "B", label: "Bestiary" }, { key: "Esc", label: "Close" }]} />
        </div>
      </div>

      {children}
    </div>
  );
};
