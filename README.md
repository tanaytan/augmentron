# Augmentron project website

Research article for **Augmentron: Scalable Multi-View Visual Augmentation for Robot Learning**, accepted to the 8th Robot Learning Workshop at NeurIPS 2026.

Tanay Tandon¹²*, Aseem Doriwala¹*, Jade Choghari¹, Catherine Weaver¹, Pragna Mannam¹

*Equal contribution. ¹ Scale AI. ² University of Pennsylvania.

[Live website](https://tanaytan.github.io/augmentron/)

## Edit and preview

The site has no dependencies or build step. Run this command from the repository root:

```sh
python3 serve.py --port 4173
```

Open `http://127.0.0.1:4173/`.

- `serve.py`: local preview server with byte-range support for video scrubbing.
- `index.html`: article, figures, author list, paper link, and citation.
- `styles.css`: typography, colors, layouts, responsive rules, and motion.
- `site.js`: figure playback and timelines, mask visibility, trial playback, complete-results table, citation copying, reading progress, and reduced motion.
- `content.md`: readable copy of the current article, captions, and numerical tables.
- `assets/results.csv`: all 72 task-level and pooled success percentages, with rollout counts.
- `assets/videos/expansion.mp4`: the pre-rendered wall of 49 moving prototype examples.
- `assets/images/expansion-poster.jpg`: the wall's opening frame.
- `assets/images/expansion-wall.jpg`: the complete wall shown when motion is reduced.
- `assets/images/expansion/` and `assets/expansion.json`: supporting source stills, identifiers, and wall positions.
- `assets/paper/augmentron.pdf`: manuscript with the five-author list.

`presentation-style.html` mirrors the main page. Update it when editing `index.html`. Older review URLs redirect to the main article. Earlier scene-explorer designs remain in Git history.

## GitHub Pages

Pages serves the root of the `main` branch at [tanaytan.github.io/augmentron](https://tanaytan.github.io/augmentron/). The `.nojekyll` file keeps the site buildless. Relative asset URLs work under the repository subpath.

## Article and controls

The article starts with the collection problem and the idea of reusable scenes. It then shows prototype edits, explains protected pixels and scene rendering, measures processing time, and evaluates the trained policies. A static three-condition chart presents the matched comparison without requiring selections. Task-level results, larger recipes, and comparison limits sit in one disclosure.

- The opening wall plays a pre-rendered video of room and table edits across different cup, towel, and vase recordings. It grows through 1, 9, 25, and 49 moving examples. **Replay expansion**, **Play / Pause**, and the **Expansion timeline** let readers restart, pause, and scrub it.
- **Hide masks / Show masks** toggles the protected robot and towel overlays on a verified original frame.
- **Replay unfolding**, **Play / Pause**, and the **Unfolding timeline** control a schematic six-face cubemap. It unfolds and folds back into a room. The diagram explains a reusable representation; it does not generate or reconstruct a room.
- **The full pipeline**, **Timing scope and Cosmos-Transfer1**, and **Task results and larger recipes** reveal optional detail. The complete table supports horizontal scrolling on small screens, and its CSV is downloadable.
- Two illustrative trial videos have native playback controls and **Replay both trials**. They start automatically when visible, pause when out of view, and use different manually reset starts.
- **Copy BibTeX** copies the displayed citation. **Reduce motion** and the system motion preference disable automatic figure transitions and trial playback.

The expansion and cubemap stay at their opening states until readers reach them. They loop while in view and pause out of view. Scrubbing pauses automatic progress; Play resumes it. Reduced motion shows the full static wall and unfolded cubemap, with explicit playback and timeline controls still available.

The header links to Method, Results, and the paper. A reading-progress line and current-section indicator support navigation.

## Media and scientific limits

The paper supplies the final method and numerical evidence. Prototype videos and example trials are labelled separately from that evidence.

The mask figure uses an original frame extracted from the paper and its matching masks. The task-object mask includes a few extra edge regions, which remain visible. The expanding wall contains 49 examples from different recordings. Its earlier prototype clips cycle through generated appearances. They illustrate room and table edits; the final method holds each generated scene fixed through a recording. The wall does not show one source recording becoming 49 matched variants.

The final method generates a static working-area image and a six-image cubemap once. Fixed-camera backgrounds are rendered once and reused; wrist-camera views render from changing recorded poses. Surface edits use a calibrated table plane. The pipeline needs camera calibration, robot geometry, and usable masks.

- The matched 30k experiment compares real-only training with Augmentron 50/50 at the same 1× data volume and schedule. Every source episode is represented once.
- Pooled success is 66.7% → 76.7% in the original setup, 18.0% → 45.3% with distractors, and 50.7% → 67.3% on steel. Original-setup cup placement falls from 86% to 72% despite the pooled improvement.
- Policies are fine-tuned separately for each task. Each task and recipe uses one trained checkpoint and one training seed. Each task/recipe/condition cell has 50 physical rollouts; pooled results have 150. These rollouts do not measure variation across training seeds.
- The 45k comparison evaluates complete recipes at unequal volume: Augmentron uses 3×, while RoboEngine and Masked Noise use 2×. It does not isolate individual pipeline components.
- The exploratory 30k Augmentron 33/67 checkpoint comes from a run scheduled for 45k updates. Its data volume and decay schedule differ from 50/50; it does not establish a scaling trend.
- Augmentron processes two fixed and two wrist streams. The evaluated policies observe the high fixed view and both wrists.
- Runtime is measured wall-clock time on one eight-H100 node. The benchmark covers 104 cup demonstrations and 30 minutes of source video across four streams. Augmentron takes 0.47 hours and RoboEngine 8.14 hours. Cosmos-Transfer1's 10.31-hour single-view run is measured; its 23.79-hour four-view figure is extrapolated.
- The illustrative trial videos are separate trials from an earlier prototype evaluation. Progress scores range from 0 to 3; only full completion, a score of 3, counts as success.
- The experiments are fine-tuning runs on three tasks and three visual conditions. Pretraining and midtraining remain future work.

This repository contains the research website. Augmentation and policy implementation code is not released here. When an archival paper URL becomes available, add it to the resources and update the citation metadata.
