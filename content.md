# Augmentron

Scalable Multi-View Visual Augmentation for Robot Learning

Tanay Tandon¹²*, Aseem Doriwala¹*, Jade Choghari¹, Catherine Weaver¹, Pragna Mannam¹

*Equal contribution. ¹ Scale AI. ² University of Pennsylvania.

Accepted to the 8th Robot Learning Workshop: Is Physical AI Going Zero-Shot? at NeurIPS 2026.

## We can only collect robot data in so many rooms.

We want our robots to work in everybody’s homes. Augmentron puts a recorded demonstration in a new visual setting. We generate the scene once, then render it through the robot’s recorded camera poses. The robot, task objects, actions, and labels stay the same.

## One motion. More worlds to learn from.

High, low, and two wrist views. Look around. Change the setting.

Environment edits change the room. Surface edits change the workspace’s appearance. The recorded motion, task objects, and training labels stay the same.

The interactive examples are presentation montages: several generated appearances over the same recorded motion. A task’s environment and surface clips share a trajectory. Gallery examples come from different source demonstrations. Augmentron processes four streams; the evaluated policy uses the high fixed view and both wrists.

## Can synthetic data help solve the generalization problem?

A human operates a copy of the robot again and again until it learns to clone that behavior. We can only set up so many scenes in the lab. A new room, table, or a few extra objects can confuse the policy.

We wanted to widen the visual coverage of those demonstrations. That starts with a constraint: change the videos while keeping the state-to-action labels valid.

## How does this work?

Two stages. Segmentation, then augmentation.

A demonstration is more than a video. We record camera views, the robot’s joint positions, its actions, and instructions for each part of the task. Change the images, and the original action labels still need to make sense.

### What shouldn’t change?

If the task is to pick up an apple, it shouldn’t suddenly become picking up an orange. We protect the robot and task objects, then edit the rest.

Robot state and camera calibration project the robot mesh into each view. Task annotations guide SAM 3 masks for the objects and workspace.

### “I just want to put this robot and its objects in a new room.”

A room can be six 2D planes: a floor, a ceiling, and four walls. We generate that room representation once. We know where the wrist cameras are looking, so we render the room from their recorded poses.

For a surface edit, we anchor a generated texture to the calibrated table plane. As the camera moves, the texture stays attached to the table.

A temporal median supplies a mostly foreground-free reference. FLUX.2-klein-4B generates the scene assets. Rendering and compositing reuse them throughout the trajectory.

## 30 minutes in. 28 minutes out.

All four camera streams. One node with eight H100s. 104 cup demonstrations.

| Pipeline | Measured wall-clock time |
| --- | ---: |
| Augmentron | 0.47 hours |
| RoboEngine | 8.14 hours |

Measured on the same 30-minute, four-view source set. Augmentron runs at 0.93× source duration. Longer trajectories mainly add rendering and compositing work.

Timing covers cold model construction through local output audit. It excludes queueing, container-image retrieval, credential gates, artifact staging, inter-boot delays, and publication.

Cosmos-Transfer1 takes 10.31 hours for a measured single-view run. The paper extrapolates 23.79 hours for four views; that figure was not measured directly.

## Does the robot improve?

First, does it still work in the original setup? Then, how well does it do in a setup it has never seen?

We fine-tuned π₀.₅ on cup-on-saucer placement, towel folding, and flower-in-vase insertion. The dataset contains 1,793 real demonstrations and 9.16 hours of recorded data.

### Replace half the data. Keep the volume.

Both policies train for 30k steps with 1× effective data volume. Each source demonstration appears once. The augmented recipe is 50% real, 25% environment edits, and 25% surface edits.

| Evaluation | Real only | Augmentron 50/50 |
| --- | ---: | ---: |
| Original setup | 66.7% | 76.7% |
| Added distractors | 18.0% | 45.3% |
| Reflective steel | 50.7% | 67.3% |

In the original setup, pooled success rises from 66.7% to 76.7%. The task-level results are mixed: cup placement falls from 86% to 72%.

Add extra objects to the table, and the real-only baseline falls to 18.0%. Half-augmented training reaches 45.3%. All three tasks improve under distractors.

Replace wood with reflective steel. Pooled success rises from 50.7% to 67.3%. All three tasks improve in this condition.

Each pooled result uses 150 rollouts, with 50 per task and condition. Each task/recipe uses one training seed.

We changed the room and the surface. We didn’t explicitly insert distractors around the task. The test asks how well that transfers to a different kind of visual shift.

### Keep the real data. Add the augmented data.

All three recipes train for 45k steps. Augmentron uses 3× data volume: real + environment + surface. RoboEngine and Masked Noise use 2×. This comparison evaluates the complete recipes.

| Evaluation | Augmentron 33/67 | RoboEngine | Masked Noise |
| --- | ---: | ---: | ---: |
| Original setup | 71.3% | 57.3% | 68.7% |
| Added distractors | 66.0% | 53.3% | 52.0% |
| Reflective steel | 60.7% | 41.3% | 48.0% |

Augmentron leads in pooled success in all three conditions. Task-level outcomes are mixed. Its data volume is larger than both baselines’.

### “I need to pick up a flower. I need to put it in the vase.”

The page includes two illustrative trials with added distractors, from the intern presentation. Real only finishes with score 1 of 3. Real + augmented succeeds with score 3 of 3. These are separate rollouts with different manually reset starting configurations. The aggregate results carry the comparison.

## There’s still a lot of work to do here.

The matched experiment gives us a useful result: changing the appearance of existing demonstrations can improve robustness at the same data volume and training schedule.

The gains vary by task. Masked Noise is competitive. At 45k steps, Augmentron leads in pooled success in all three conditions, but the data volumes differ and we evaluate the pipeline components together.

More augmentation also needs care. The larger recipe’s exploratory 30k checkpoint improves pooled distractor success, while original-setup and surface success fall. It uses a different decay schedule. These runs do not establish a scaling trend.

We tested three tasks, three visual conditions, and one training seed. The pipeline needs calibrated cameras, robot geometry, and usable masks. It changes appearance while retaining the recorded behavior.

The next question I’d like to ask: what happens when this goes into pretraining or midtraining?

The experiments here are fine-tuning runs. Larger-scale training remains future work.

## Paper and talk

The downloadable paper contains the final method and complete results. My intern talk tells the story of an earlier version. This page uses the paper’s final method and experimental results.
