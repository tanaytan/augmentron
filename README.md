# Augmentron project website

A static paper website for **Augmentron: Scalable Multi-View Visual Augmentation for Robot Learning**.

Tanay Tandon¹²*, Aseem Doriwala¹*, Jade Choghari¹, Catherine Weaver¹, Pragna Mannam¹

*Equal contribution. ¹ Scale AI. ² University of Pennsylvania.

[Live website](https://tanaytan.github.io/augmentron/)

## Edit and preview

The site has no dependencies or build step.

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open `http://127.0.0.1:4173/`.

- `index.html`: narrative, author list, links, citation, and semantic layout.
- `styles.css`: presentation colors, typography, layouts, responsive rules, and interaction transitions.
- `site.js`: shared video clock, camera focus, montage selection, mask overlays, room net, and result controls.
- `content.md`: a readable copy of the public narrative.
- `assets/results.csv`: all 72 source-table percentages and sample sizes.
- `assets/paper/augmentron.pdf`: public-format manuscript with the five-author list.

`presentation-style.html` mirrors the main page. Older design-review URLs redirect to it. Their earlier layouts remain in Git history. When changing the page, update the mirror too.

## GitHub Pages

Pages serves the root of the `main` branch at https://tanaytan.github.io/augmentron/.
The `.nojekyll` file keeps it buildless. Asset URLs are relative and work under the repository subpath.

## Story and design

The page follows Tanay’s spoken presentation: limited collection environments → explore edited demonstrations → explain why the action labels remain valid → protect the task → reuse a six-plane room across cameras → measure processing time → test the trained robot Its words and questions are edited from the actual presentation audio, rather than inferred from slide text.

The Scale presentation supplies cream, forest green, muted purple, Arial at weight 400, large questions, and camera framing. A live scroll-and-click study of hone.com informed the varied chapter compositions, generous media stage, coordinated selected states, purposeful transitions, and accessible optional depth. No Hone assets are included.

The scene inspector uses one four-view mosaic video, so camera views always share a clock. Paired environment/surface examples preserve playback time. Wall selections open at their thumbnail’s 2-second moment. These files are **presentation montages**, with changing generated appearances inside a trajectory. They illustrate the outputs; they do not establish the final method’s single-scene temporal consistency by themselves. Gallery examples come from different source demonstrations.

When adding a gallery clip, inspect all four cameras at several points in the trajectory to check that the task objects remain visible. The wooden-workshop vase montage is excluded because its wrist-view mask loses the vase at some times. The vase controls use the matching 264/265 pair, which is cleaner than 676/677. The public caption acknowledges the earlier demos' remaining masking artifacts.

The mask inspector uses actual presentation masks aligned with the supplied towel still. The object mask has a few extra regions at the edge, which remain visible. The foldable room diagram is explicitly a schematic of the six-face representation. It does not reconstruct an actual room or run generation.

The default evidence view shows the same-volume distractor comparison: 18.0% to 45.3% pooled success. Results change within stable chart rows, with exact percentages shown immediately. Training comparison, test setting, and task controls are separately labeled; the task selector sits beside the chart. Negative differences remain visible. Larger-recipe volumes and baseline definitions appear alongside that comparison. The full table has a keyboard-focusable horizontal scroll region on narrow screens. Conditions, task selections, illustrative setup photos, percentages, interpretation, and training-mixture labels update together. The surface condition uses the supplied cup-task surface still, clearly labeled as an example even when another task is selected. A motion control and the system reduced-motion preference disable transitions and automatic scene playback. Gallery selections reset to all four cameras, seek to the pictured 2-second moment, and return focus to the play control. User-requested media playback remains available.

## Scientific boundaries

The supplied paper is authoritative for the final method and numerical evidence. The earlier intern talk supplies the voice and illustrative augmentation/rollout footage.

- The matched 30k experiment compares real only with 50/50 at the same 1× volume and schedule. Every source episode is represented once.
- The 45k experiment compares complete recipes at unequal volume: Augmentron 3×, RoboEngine 2×, Masked Noise 2×.
- The exploratory 30k 33/67 checkpoint follows a 45k decay schedule. It does not establish a scaling trend.
- The pipeline processes four cameras. Evaluated policies consume high fixed and both wrists.
- Runtime is wall-clock time on one eight-H100 node, rather than GPU-hours. The Cosmos four-view number is extrapolated; the measured run uses one view.
- Cup-on-saucer success in the original setup falls in the matched comparison despite pooled improvement.
- Each task/recipe uses one training seed. Rollouts do not measure variation across seeds.
- The illustrative policy videos are separate trials with manually reset starts.

The original paper files were left unchanged. A local build copy fixes an xcolor option clash, selects final workshop formatting, and updates authors, affiliations, equal contribution, and PDF metadata. Scientific text and results remain unchanged.

This repository contains the website, rather than the augmentation/policy implementation. No arXiv link or implementation release is claimed. When an archival paper URL exists, add it to the resources and update BibTeX metadata.
