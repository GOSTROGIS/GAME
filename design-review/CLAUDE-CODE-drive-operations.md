# Claude Code — Drive operations

Copy-pasteable prompts for Claude Code, covering every mutation it is
authorised to make in the working Drive. Hand it one numbered prompt at a
time; each is self-contained and states its own acceptance test.

---

## Who decides what

Three parties, three different kinds of authority. Getting this wrong is how
canon rots, so it is stated before any task.

| Role | Party | Authority | May not |
|---|---|---|---|
| **Design authority** | Claude design | Writes the prompts and the per-subject specs. Decides what is canon. | Cannot see CDN-hosted art (canvas taint) — depends on vendored files |
| **Generator** | ChatGPT | Produces image masters from the prompts, verbatim | Does not author intent; a prompt it improvises from is not canon |
| **Custodian** | Claude Code | Moves, names, vendors, hashes and records. Owns Drive and repo hygiene | **Never authors or edits a prompt. Never invents a spec.** |

The custodian's job is to make authority *legible and durable*. If a task
below seems to require inventing content, that is the signal to stop and
report, not to fill the gap.

### The manifest law, restated

Binding on every operation in this document:

1. **The concept-art prompt is law.** The exact approved prompt string is the
   highest authority.
2. **The concept art is law after that.** Art beats prose. The prompt beats
   its own art.
3. **Everything else is subordinate** — project prose, procedural rigs,
   material guesses. May fill gaps. May never contradict, and never guesses.

Encoded in `kit/hm-art-law.js`. The refusal path is a first-class outcome:
missing authority produces a stated refusal, never a plausible invention.

### Two rules that catch most mistakes

- **A graded master is a corrupted master.** Every batch-01 prompt specifies
  *ungraded neutral presentation*. `--grade-character`
  (`saturate .72 / contrast 1.09 / brightness .82`) is a **display-time**
  filter only. Never bake it into a stored file.
- **Masters are immutable.** A revision is a new version (`-v2`) with a
  recorded reason. Never overwrite or silently replace an approved master.

---

## Known Drive anchors

Stable ids, verified 2026-08-26. Resolve everything else by listing rather
than trusting a hardcoded table.

```
working root            1DQnahPT5zXLEaWPW07F6Ffx4I_48SxA6
unsynced images         1LrZfJKQ0kQjxKJIYFJB4r3hwUhJRwSRU
  └─ sable-reach-unsynced-images-2026-08-26
prompts/                1LwNbBt3bEGiY6tSOgAL6GgAqqi2qmQxU
  ├─ family-plates-batch-01.md            1xCRXop9F0ZeR120x42x179e_2UTv1_xi
  └─ family-plates-batch-01-recovery.md   12ZDiXdCl2rKd73Sdl60btNAauQ6TMbXy
```

**The file-id → subject mapping already exists** in
`kit/hm-concept-art.js` (`CONCEPT_ART`): 18 named characters and 24 enemy
forms, each with `master`, `cutout`, `file` and `set`. Read it rather than
re-deriving the mapping from folder listings — and if a listing disagrees with
it, that disagreement is the finding.

---

## Prompt 01 — Vendor the 18 named-cast plates

> **Goal.** Copy the 18 named-character concept plates out of Drive and into
> the repo as real project files, so they are same-origin, readable by
> automated design review, and no longer dependent on Drive access or
> Google's CDN.
>
> **Why this is first.** These plates are rank-2 authority that the design
> process currently **cannot see**. `lh3.googleusercontent.com` taints the
> canvas on read, and the capture path cannot embed a cross-origin image
> either. So renders of these characters are presently unverifiable against
> their own art. Vendoring is the single change that unblocks it.
>
> **Inputs.** `kit/hm-concept-art.js` → `CONCEPT_ART`. Use every entry whose
> key starts with `npc.` and which has a non-null `master` or `cutout`.
>
> **Steps.**
> 1. For each entry, download the **cutout** if present, else the **master**.
> 2. Write to `assets/characters/<file>.png`, where `<file>` is the entry's
>    existing `file` value (e.g. `nhal-without-shadow-v1`). Append `-cutout`
>    when the cutout was the source, so master and cutout never collide.
> 3. Store the file **exactly as downloaded**. Do not resize, recompress,
>    colour-convert, crop, or apply any grade.
> 4. Write a sidecar `assets/characters/<file>.provenance.json` per file:
>    ```json
>    {
>      "subject": "npc.gatewarden-nhal",
>      "driveId": "1aJxNT6x0yYufy-CxkkCiMQUoSnE4DyhF",
>      "driveFolder": "<resolved folder name>",
>      "kind": "cutout",
>      "sha256": "<hash of the bytes written>",
>      "bytes": 0,
>      "pixels": [0, 0],
>      "downloadedAt": "<ISO 8601, real clock>",
>      "graded": false,
>      "promptCall": null,
>      "promptFile": null
>    }
>    ```
>    `promptCall` and `promptFile` stay `null` until Prompt 03 supplies them.
>    A null there is an honest gap; a guess is a law violation.
> 5. Update `kit/hm-concept-art.js`: add `local: 'assets/characters/<file>.png'`
>    to each vendored entry. `artFor()` already prefers `local` and reports
>    `vendored: true`, so the surface switches over with no further change.
>
> **Acceptance.**
> - `ls assets/characters/*.png` returns the 4 existing plates plus 18 new.
> - Every new PNG has a sidecar, and every sidecar's `sha256` matches its file.
> - Loading `Hollow March Art Bible.dc.html` **offline** shows all 18 plates.
> - No file in `assets/` has been re-encoded: byte size matches Drive's.
>
> **Refuse and report if.** A Drive id 404s; two entries resolve to the same
> filename; a downloaded file is not a PNG; or `CONCEPT_ART` names a subject
> that does not exist in `kit/hm-actor-cast.js`.

---

## Prompt 02 — Read and reconcile the recovery file

> **Goal.** `prompts/family-plates-batch-01-recovery.md`
> (`12ZDiXdCl2rKd73Sdl60btNAauQ6TMbXy`, 6.8 KB) has **never been read** by the
> design process. `kit/hm-art-law.js` → `LAW_SOURCE.recovery.read` is `false`.
> Read it and reconcile.
>
> **Steps.**
> 1. Read it in full.
> 2. Diff its content against `FAMILY_LAW` in `kit/hm-art-law.js` — ten
>    families, each with `subject`, `violation`, `alsoRequired`, `palette`,
>    `materials`, `light`, `avoid`, `promptCall`.
> 3. Produce `prompts/RECONCILIATION-batch-01.md` listing, per family:
>    agrees / adds / **contradicts**.
> 4. Set `LAW_SOURCE.recovery.read = true` and add `readOn`.
>
> **Do not** edit `FAMILY_LAW` to match. If the recovery file contradicts the
> main prompt file, that is a canon conflict for the design authority to
> settle — report it, do not resolve it.
>
> **Acceptance.** The reconciliation file exists, covers all ten families,
> and every "contradicts" row quotes both sources verbatim.

---

## Prompt 03 — Build the provenance manifest

> **Goal.** One machine-readable record tying every image in Drive to the
> prompt that produced it. `family-plates-batch-01.md` says reference lineage
> "is recorded separately in the provenance manifest" — that manifest is not
> in the `prompts/` folder. Either locate it or create it.
>
> **Steps.**
> 1. Search the working root for an existing provenance manifest before
>    creating one. If found, extend it; do not fork it.
> 2. Otherwise create `prompts/provenance.json`:
>    ```json
>    {
>      "version": 1,
>      "updatedAt": "<ISO 8601>",
>      "entries": [
>        {
>          "driveId": "...",
>          "filename": "ash-husk-v1.png",
>          "folder": "ashbound-individual-concept-masters-2026-08-26",
>          "subject": "enemy.ash-husk",
>          "family": "ashbound",
>          "promptFile": "prompts/family-plates-batch-01.md",
>          "promptCall": null,
>          "generator": "chatgpt",
>          "status": "approved",
>          "supersedes": null,
>          "graded": false
>        }
>      ]
>    }
>    ```
> 3. External generation identifiers stay redacted in published files. Keep
>    `promptCall` null and use the repository-local prompt file plus content
>    hash for traceability; family inheritance is explicit, not inferred.
> 4. `status` ∈ `approved` | `rejected` | `superseded` | `unreviewed`.
>    Default to `unreviewed`. Never assume `approved`.
>
> **Acceptance.** Every image file under the unsynced-images tree has exactly
> one entry. Counts by folder match a fresh listing. No `promptCall` exists
> that is absent from a prompt file.
>
> **Refuse and report if.** An image cannot be attributed to any family — an
> orphan image is a finding, not a row to invent.

---

## Prompt 04 — Scaffold the named-cast prompt file

> **Goal.** The 42 named characters have **no rank-1 authority**. Batch 01
> covers bestiary families only. Create the file that will hold their prompts.
>
> **This prompt does not author prompt text.** Claude design writes the prompt
> strings; ChatGPT generates from them; you create the container and enforce
> its form.
>
> **Steps.**
> 1. Create `prompts/named-cast-batch-01.md` with a header identical in form
>    to `family-plates-batch-01.md`: title, a sentence stating these are the
>    exact submitted strings, and a note that reference-image paths are
>    excluded because lineage lives in the provenance manifest.
> 2. For each of the seven characters with an authored signature clip in
>    `kit/hm-actor-cast.js` (`authoredClip: true` — Maela Voss, Torren Vale,
>    Ysra Pell, Orik Senn, Nhal Without Shadow, Vellin the Unwritten,
>    Sera Dusk), emit a section:
>    ```
>    ## <Name>
>
>    Generation call: `TBD`
>
>    ```text
>    PENDING — awaiting prompt from design authority.
>    ```
>    ```
> 3. Add a `## Form` section recording the field order every batch-01 prompt
>    uses, so a future prompt can be checked against it: Use case, Asset type,
>    Primary request, Input images, Scene/backdrop, Subject, Style/medium,
>    Composition/framing, Lighting/mood, Color palette,
>    Materials/textures, Constraints, Avoid.
>
> **Acceptance.** File exists with 7 `PENDING` sections and the `## Form`
> section. **Zero** invented prompt prose anywhere in it.
>
> **Refuse and report if.** Asked to fill a `PENDING` block from the character
> descriptions in `kit/hm-actor-cast.js`. Those are rank-3 prose; promoting
> them to rank 1 is precisely the guessing the law forbids.

---

## Prompt 05 — Normalise Drive folder naming

> **Goal.** Folder names currently mix conventions:
> `sable-reach-unsynced-images-2026-08-26`,
> `ashbound-individual-concept-masters-2026-08-26`, `exact-word-finals`,
> `grave-tithe`, `unwritten-roads`. At thousands of assets this stops being
> navigable.
>
> **Target convention.**
> ```
> <subject-scope>-<artefact-kind>[-<state>]-<YYYY-MM-DD>
>
> subject-scope   family slug, faction slug, or `named-cast`
> artefact-kind   family-plate | concept-master | cutout | draft
> state           approved | rejected | superseded   (omit when approved)
> ```
>
> **Steps.**
> 1. Produce `prompts/FOLDER-RENAME-plan.md` first: current name → proposed
>    name → file count → affected `CONCEPT_ART` keys. **Do not rename yet.**
> 2. Wait for approval on the plan.
> 3. On approval, rename in Drive, then update `SOURCE.folder` and any `set`
>    values in `kit/hm-concept-art.js` in the **same commit**.
>
> **Acceptance.** After renaming, every `set` value in `CONCEPT_ART` matches a
> real folder name, and file counts per folder are unchanged.
>
> **Never** rename a folder without updating the register in the same change.
> A register pointing at a folder that no longer exists is worse than an
> inconsistent name.

---

## Prompt 06 — Quarantine rejected drafts

> **Goal.** Three batch-01 prompts are `precise-object-edit` calls whose input
> was *"the rejected <family> draft"* — March Deserters, Hush Order, Echo
> Choir. Those rejected drafts are still somewhere in Drive, unlabelled, and a
> rejected draft that looks like a master will eventually be used as one.
>
> **Steps.**
> 1. Identify candidate drafts: images in a family's folder that the
>    provenance manifest does not mark `approved`.
> 2. Move them to `<family>-draft-rejected-<date>/`.
> 3. Set `status: "rejected"` and `supersedes`/`supersededBy` in the manifest.
> 4. Never delete. A rejected draft is evidence of a decision.
>
> **Acceptance.** Every folder holding an approved master contains **only**
> approved masters. Every rejected draft is in a `-rejected-` folder with a
> manifest row pointing at what replaced it.
>
> **Refuse and report if.** You cannot tell a draft from its approved
> replacement. Guessing which of two similar images was approved is
> exactly the failure this task exists to prevent.

---

## Prompt 07 — Standing sync

> Run after any Drive change.
>
> 1. List the unsynced-images tree; diff against `prompts/provenance.json`.
> 2. New files → `unreviewed` rows. Missing files → flag, never silently drop.
> 3. Refresh `SOURCE.readOn` in `kit/hm-concept-art.js` with the **real**
>    current timestamp — not a rounded or recalled one.
> 4. Re-verify vendored files: sidecar `sha256` still matches bytes on disk.
> 5. Write a short receipt: counts by status, what changed, what is unattributed.
>
> **Acceptance.** The receipt's numbers are all derived from listings and
> hashes, never carried over from the previous run.

---

## Refusal list

Stop and report rather than proceed:

- Writing or editing any prompt string, or filling a `PENDING` block from prose
- Applying `--grade-character`, or any grade, to a stored file
- Overwriting or deleting an approved master
- Inventing a `promptCall`, or attributing an image to a family on resemblance
- Renaming without updating `kit/hm-concept-art.js` in the same change
- Recording `approved` status that no prompt file or reviewer states
- Marking `recovery.read = true` without having read it
- Resolving a contradiction between two prompt files

Every one of these is the custodian being asked to act as the design
authority. The correct output is a finding.

---

## Open, for the design authority

Not Claude Code's to fix — listed so nothing here reads as complete.

1. **Named-cast prompts do not exist.** Prompt 04 builds the container; the
   seven `PENDING` blocks need writing.
2. **Ten families are unrenderable.** Every batch-01 family needs a chassis
   the humanoid rig does not have — quadruped, hexapod, bodyless-acoustic,
   composite-wheel, and six "humanoid" ones whose torso is not a torso. All
   ten currently return `REFUSED` from `conformance()`.
3. **The rig carries no props.** The four readable plates average six
   authored hard props and nine garment layers each; `rig.props` is empty. No
   lighting or particle work closes that.
4. **The Gloamfarer plate is off-standard** — white cutout, flat lighting,
   against batch-01's near-black field and one-sided raking key. Provenance
   mismatch to resolve before it is used as a lighting reference.
