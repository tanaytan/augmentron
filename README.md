# Augmentron project website

A static research project site for *Augmentron: Scalable Multi-View Visual Augmentation for Robot Learning*, by Tanay Tandon and Aseem Doriwala.

## Review the content and designs

- `content.md`: proposed project-page copy.
- `directions.html`: compare three working directions.
- `paper.html`: conventional academic project page.
- `notebook.html`: research notebook layout.
- `presentation-style.html`: adapts the supplied presentation typography, colors, and camera layouts.
- `contact-sheet.html`: earlier camera-led sketch, retained for reference.
- `index.html`: the presentation-style direction as the working default.

All directions use the same experimental data and interactions. They contain no dependencies or build step.

Run `python3 -m http.server 4173` in this directory. Open `http://127.0.0.1:4173/directions.html`.

## GitHub Pages

Repository: https://github.com/tanaytan/augmentron

The working default is the presentation-style direction. To switch designs, copy the chosen HTML file to `index.html`. Pages deploys from the root of the main branch. The `.nojekyll` file makes the site buildless. All asset URLs are relative, so the site also works under a repository subpath.

The design-review page and unused direction files can be left out of the published site. Keep `styles.css`, `directions.css`, `site.js`, `.nojekyll`, `index.html`, and `assets/`.

The paper-page and notebook variants remain available alongside the working default.

## Sources and claim boundaries

The supplied paper is authoritative for the method and final results. The earlier intern presentation supplies augmentation footage and illustrative policy rollouts. The page explicitly labels the presentation as an earlier version.

- The matched 30k experiment compares real-only with 50/50 at 1× volume and the same training schedule.
- The 45k experiment compares complete recipes at unequal volume: Augmentron 3×, RoboEngine 2×, and Masked Noise 2×.
- The exploratory 30k 33/67 checkpoint follows a 45k schedule.
- The pipeline augments four cameras; policies consume three.
- Runtime is wall-clock time on one eight-H100 node, not GPU-hours.
- Cosmos four-view timing is extrapolated. Its measured timing is for one view.
- Cup-on-saucer ID performance decreases in the matched comparison despite a pooled improvement.
- One training seed is evaluated. Rollouts do not measure seed variation.

`assets/results.csv` contains the exact source-table percentages and sample sizes. The dynamic chart reads the same numbers from `site.js`.

`assets/paper/augmentron.pdf` was compiled from the supplied manuscript. The original files were left unchanged. The local build copy fixes a package-loading option clash for xcolor and selects final, non-anonymous workshop formatting. The listed authors are displayed, review line numbers are removed, and the submission-only distribution notice is replaced by the workshop footer. The paper text and experimental results are unchanged.

The presentation video was resized and compressed for browser playback. The underlying augmentation and policy code is not included or represented as released. No arXiv or code-release links are invented.

## Later updates

Replace the PDF link with an arXiv link when the paper is available. Update the citation with the official archival metadata. Add an implementation-code link when an actual public repository is available.
