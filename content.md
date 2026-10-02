# Augmentron
## Scalable Multi-View Visual Augmentation for Robot Learning

Tanay Tandon and Aseem Doriwala
Scale AI

Accepted to the 8th Robot Learning Workshop: Is Physical AI Going Zero-Shot? at NeurIPS 2026.

Augmentron changes the visual setting of a recorded robot demonstration. We generate scene assets once and render them through the recorded camera poses. The new appearance stays consistent across fixed cameras, moving wrist cameras, and time. The original robot and task-object pixels are composited back into the scene. State, actions, language labels, and timing remain unchanged.

## The problem

A policy can learn to put a cup on a saucer and still struggle when someone leaves extra objects on the table. In our experiments, a policy trained only on real demonstrations reached 66.7% pooled success in the original setup. With unseen distractors, success fell to 18.0%.

We wanted to widen the visual coverage of those demonstrations. Editing robot data introduces a constraint that individual image edits do not have: the new scene must hold across an entire trajectory and several cameras. Wrist cameras move with the arm. A generated table needs to remain anchored as the viewpoint changes.

## Reusable scene assets

The generative model produces a scene representation that we reuse throughout the demonstration. Longer trajectories mainly add rendering and compositing work, rather than repeated generative inference.

The pipeline has three stages:

1. **Protect the robot and task objects.** Forward kinematics projects the robot mesh into each camera. Task annotations become SAM 3 prompts for task objects and the workspace. The workspace is segmented separately so it can be kept or changed.
2. **Generate the scene assets.** A temporal median recovers a mostly foreground-free reference image. FLUX generates a static scene image and a six-face room representation. A surface texture can be anchored to the calibrated table plane.
3. **Render through the recorded cameras.** Fixed-camera renderings are reused over time. Wrist-camera poses come from robot state and calibrated transforms. Original protected pixels are composited over each rendered view.

The pipeline augments two fixed and two wrist-camera streams. The policy uses the high fixed view and both wrist views.

## Physical evaluation

We fine-tuned policies from π₀.₅ on 1,793 real demonstrations, totaling 9.16 hours. We tested cup-on-saucer placement, towel folding, and flower-in-vase insertion. Each policy faced the original setup, unseen task-irrelevant objects, and a workspace shift from wood to reflective steel.

### The controlled result

Real-only training and Augmentron 50/50 use the same effective data volume and 30k-step training schedule. In the augmented recipe, 50% of observations remain real, 25% use environment edits, and 25% use workspace edits. Every source demonstration is represented once.

| Condition | Real only | Augmentron 50/50 |
| --- | ---: | ---: |
| Original setup | 66.7% | 76.7% |
| Added distractors | 18.0% | 45.3% |
| Reflective steel surface | 50.7% | 67.3% |

Each pooled result contains 150 physical rollouts, with 50 per task.

The clearest gain is under distractors: 27.3 percentage points, with improvement on all three tasks. The gains vary by task in the original setup. Cup-on-saucer success falls from 86% to 72%, while towel and vase success improve.

### The larger recipes

At 45k steps, Augmentron has the highest pooled success in all three conditions: 71.3% in the original setup, 66.0% with distractors, and 60.7% on steel. Augmentron uses 3× effective data volume. RoboEngine and Masked Noise each use 2×. The comparison evaluates complete recipes and does not isolate the effect of the augmentation method from dataset size.

Masked Noise is competitive, reaching 68.7%, 52.0%, and 48.0% in those conditions.

## Runtime

On a 30-minute source set of 104 episodes, Augmentron processes four camera views in 0.47 hours, about 28 minutes. RoboEngine takes 8.14 hours on the same source set and hardware. Both run on one node with eight H100 GPUs.

These are wall-clock runtimes. A measured single-view Cosmos-Transfer1 run takes 10.31 hours. The paper's four-view estimate of 23.79 hours is an extrapolation, not a direct measurement.

## What the experiments leave open

More augmented data does not improve every result. At the exploratory 30k checkpoint, the larger 33/67 recipe improves pooled distractor success over 50/50, but lowers original-setup and workspace success. Its training schedule also differs. These runs do not establish a scaling trend.

The experiments cover three tasks, three visual conditions, and one training seed. Rollouts measure evaluation uncertainty, not variation across training runs. The pipeline components are evaluated together. The method also depends on camera calibration, robot geometry, and usable masks. It changes appearance while retaining the recorded behavior.

## Paper and presentation

The PDF contains the method, training recipes, task-level results, and benchmark protocol. The intern presentation shows the motivation and example rollouts from my Scale internship. It covers an earlier version of the work. The project page uses the paper for the final method and results.
