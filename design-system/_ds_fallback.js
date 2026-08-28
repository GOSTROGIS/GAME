/* _ds_fallback.js — DEV SHIM. Not part of the shipped design system.

   The generated runtime library (_ds_bundle.js) appears once this project's
   file type is set to Design System. This shim resolves window.HollowMarch
   either way:

     1. try the generated bundle
     2. otherwise build the namespace from the component sources

   It exposes window.HollowMarchReady, a promise every card awaits before
   mounting. Once the bundle exists you may replace the fallback <script> tag
   in the card files with a plain _ds_bundle.js tag and delete this file. */
(function () {
  var here = document.currentScript && document.currentScript.src;
  var base = here ? here.slice(0, here.lastIndexOf("/") + 1) : "./";

  var FILES = [
    "components/icons/Icon.jsx",
    "components/meters/Meter.jsx",
    "components/labels/Kbd.jsx",
    "components/labels/Eyebrow.jsx",
    "components/labels/FieldLabel.jsx",
    "components/labels/StatusPill.jsx",
    "components/labels/LockedLore.jsx",
    "components/labels/MicroMeta.jsx",
    "components/buttons/Button.jsx",
    "components/buttons/CodexBack.jsx",
    "components/surfaces/GlassPanel.jsx",
    "components/surfaces/Modal.jsx",
    "components/surfaces/GamePanel.jsx",
    "components/surfaces/BudgetBar.jsx",
    "components/surfaces/Grain.jsx",
    "components/surfaces/Vignette.jsx",
    "components/hud/PlayerCard.jsx",
    "components/hud/TargetCard.jsx",
    "components/hud/LocationCard.jsx",
    "components/hud/SideNav.jsx",
    "components/hud/ActionBar.jsx",
    "components/hud/HintStrip.jsx",
    "components/hud/QuestTracker.jsx",
    "components/hud/InteractionPrompt.jsx",
    "components/hud/Toast.jsx",
    "components/hud/CombatText.jsx",
    "components/forms/TextField.jsx",
    "components/forms/SelectBox.jsx",
    "components/forms/OptionCard.jsx",
    "components/forms/Swatch.jsx",
    "components/forms/StatStepper.jsx",
    "components/forms/MorphRow.jsx",
    "components/forms/StepDots.jsx",
    "components/forms/AttributeRow.jsx",
    "components/progression/SkillTile.jsx",
    "components/progression/TechniqueSummary.jsx",
    "components/progression/TechniqueNode.jsx",
    "components/progression/MasteryCard.jsx",
    "components/progression/ActionCodexEntry.jsx",
    "components/codex/EnemyCodexCard.jsx",
    "components/codex/CharacterCodexCard.jsx",
    "components/codex/FactionCard.jsx",
    "components/codex/FamilyStripItem.jsx",
    "components/codex/RelationshipRow.jsx",
    "components/codex/JournalEntry.jsx",
    "components/codex/WorldCard.jsx",
    "components/inventory/ItemSlot.jsx",
    "components/inventory/PaperDoll.jsx",
    "components/inventory/SheetStat.jsx",
    "components/narrative/SpeakerMark.jsx",
    "components/narrative/Dialogue.jsx",
    "components/narrative/PortraitStage.jsx",
    "components/narrative/PortraitCaption.jsx",
    "components/narrative/DeathScreen.jsx"
  ];

  function loaded() {
    return window.HollowMarch && Object.keys(window.HollowMarch).length > 0;
  }

  function tryBundle() {
    return new Promise(function (resolve) {
      var s = document.createElement("script");
      s.src = base + "_ds_bundle.js";
      s.onload = function () { resolve(loaded()); };
      s.onerror = function () { resolve(false); };
      document.head.appendChild(s);
    });
  }

  function buildFromSource() {
    if (typeof Babel === "undefined" || typeof React === "undefined") {
      if (window.console) console.error("[ds-fallback] React and Babel must load first");
      return Promise.resolve({});
    }
    return Promise.all(
      FILES.map(function (p) {
        return fetch(base + p)
          .then(function (r) { return r.ok ? r.text() : null; })
          .catch(function () { return null; });
      })
    ).then(function (sources) {
      var ns = {};

      // Sibling imports resolve against the accumulating namespace; FILES is
      // ordered dependency-first so a component's deps are present by the time
      // it is evaluated.
      function req(spec) {
        if (spec === "react") return React;
        return ns;
      }

      for (var i = 0; i < sources.length; i++) {
        if (!sources[i]) continue;
        try {
          var out = Babel.transform(sources[i], {
            sourceType: "module",
            presets: [["react", { runtime: "classic" }]],
            plugins: ["transform-modules-commonjs"]
          }).code;

          var mod = { exports: {} };
          new Function("require", "module", "exports", "React", out)(req, mod, mod.exports, React);

          var ex = mod.exports || {};
          for (var k in ex) {
            if (k === "__esModule") continue;
            // keep components AND value exports (icon path tables, constants)
            if (typeof ex[k] === "function" || typeof ex[k] === "object" || Array.isArray(ex[k])) ns[k] = ex[k];
          }
        } catch (err) {
          if (window.console) console.warn("[ds-fallback] " + FILES[i] + ": " + err.message);
        }
      }
      return ns;
    });
  }

  window.HollowMarchReady = (loaded() ? Promise.resolve(true) : tryBundle())
    .then(function (ok) {
      if (ok) return window.HollowMarch;
      return buildFromSource().then(function (ns) {
        window.HollowMarch = ns;
        if (window.console) {
          console.info("[ds-fallback] built " + Object.keys(ns).length + " components from source");
        }
        return ns;
      });
    });
})();
