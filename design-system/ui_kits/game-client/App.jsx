window.HMKit = window.HMKit || {};

window.HMKit.App = function App() {
  const { Dialogue, DeathScreen, Button, Toast } = window.HollowMarch;
  const { TitleScreen, CreatorScreen, WorldHud } = window.HMKit;

  const [stage, setStage] = React.useState("title");
  const [panel, setPanel] = React.useState(null);
  const [talking, setTalking] = React.useState(false);
  const [dead, setDead] = React.useState(false);
  const [toast, setToast] = React.useState(null);

  function announce(msg) {
    setToast(msg);
    window.setTimeout(function () { setToast(null); }, 3000);
  }

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", minWidth: "var(--shell-min-w)", minHeight: "var(--shell-min-h)", overflow: "hidden", background: "var(--shell)", isolation: "isolate" }}>
      {stage === "title" ? <TitleScreen onBegin={function () { setStage("creator"); }} /> : null}

      {stage === "creator" ? (
        <CreatorScreen
          onBack={function () { setStage("title"); }}
          onDone={function () { setStage("world"); announce("Aszelin enters Hearthmere Hold."); }}
        />
      ) : null}

      {stage === "world" ? (
        <WorldHud
          panel={panel}
          onPanel={function (id) { setPanel(id === panel ? null : id); setTalking(false); }}
          onTalk={function () { setTalking(true); }}
        >
          {talking ? (
            <div style={{ position: "absolute", zIndex: 15, left: "50%", bottom: "var(--dialogue-bottom)", transform: "translateX(-50%)" }}>
              <Dialogue
                faction="Ember Ledger"
                speaker="Vessel-Keeper Ossaline"
                initial="O"
                line="Write your name in the ledger or do not. The bells will keep it either way &mdash; but the Hold will not feed a stranger twice."
                choices={[
                  { id: "sign", label: "Sign the ledger" },
                  { id: "ask", label: "Ask about the causeway" },
                  { id: "leave", label: "Say nothing and go" }
                ]}
                onChoose={function (id) {
                  setTalking(false);
                  if (id === "sign") announce("Your name is entered in the Ember Ledger.");
                  else if (id === "ask") announce("The causeway route is marked on your atlas.");
                  else announce("Ossaline returns to her counting.");
                }}
              />
            </div>
          ) : null}

          {dead ? (
            <DeathScreen note="A tenth of your marks stayed where you fell.">
              <Button variant="ghost" onClick={function () { setDead(false); }}>Return to the wayshrine</Button>
            </DeathScreen>
          ) : null}
        </WorldHud>
      ) : null}

      {toast ? (
        <div style={{ position: "absolute", zIndex: 35, left: "50%", top: "18%", width: 330, transform: "translateX(-50%)", display: "grid", gap: 7 }}>
          <Toast>{toast}</Toast>
        </div>
      ) : null}

      {stage === "world" && !dead ? (
        <button
          type="button"
          onClick={function () { setDead(true); setTalking(false); setPanel(null); }}
          style={{ position: "absolute", zIndex: 36, right: 24, bottom: 20, padding: "6px 10px", background: "rgba(5,8,9,.7)", border: "1px solid var(--line)", color: "var(--muted)", font: "8px var(--display)", letterSpacing: ".12em", textTransform: "uppercase", cursor: "pointer" }}
        >
          Demo defeat
        </button>
      ) : null}
    </div>
  );
};

window.HollowMarchReady.then(function () {
  ReactDOM.createRoot(document.getElementById("root")).render(
    React.createElement(window.HMKit.App)
  );
});
