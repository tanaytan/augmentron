# Augmentron

Scalable Multi-View Visual Augmentation for Robot Learning

Tanay Tandon¹²*, Aseem Doriwala¹*, Jade Choghari¹, Catherine Weaver¹, Pragna Mannam¹

*Equal contribution. ¹ Scale AI. ² University of Pennsylvania.

Accepted to the 8th Robot Learning Workshop: Is Physical AI Going Zero-Shot? at NeurIPS 2026.

## We can only collect robot data in so many rooms.

We want our robots to work in everybody’s homes. Augmentron changes the room or table around a recorded demonstration. We generate the scene once, then show it from every recorded camera view. The motion and task stay the same.

18.0% → 45.3% success with added distractors. Same training volume. Three tasks, one seed.

## One motion. More worlds to learn from.

Choose a task. Pause the video. Switch room and surface edits to compare the same moment.

A generated room surrounds the recorded robot and task objects. Surface edits change the table appearance. The recorded motion, task objects, and training labels stay the same.

### About these clips

These montages come from my intern presentation and cycle through several generated appearances. Some masking artifacts remain. The task buttons open room and surface versions of one recorded motion. Gallery selections include other demonstrations.

The final paper generates scene assets once and reuses them through a trajectory. The montages illustrate the edits; their changing appearances do not demonstrate that temporal consistency.

## What should the robot learn from a demonstration?

A person teaches the robot by controlling its movements. The model learns which action to take from the camera images, the robot’s position, and an instruction. The recording also contains a particular room and table.

We wanted those demonstrations to teach the same task across more visual settings. A cup still goes on the same saucer, so its recorded action labels still make sense. The physical tests ask whether that helps in a setup the robot has never seen.

## How does this work?

Protect what stays. Generate and render what changes.

We keep the recorded behavior and change its visual setting. Masks protect the robot and task objects. Generated scene assets supply the new room and table.

### What shouldn’t change?

The towel and grippers must stay where the recorded motion expects them. We protect those pixels, then edit the room or table around them.

The recorded joint angles and camera calibration place the robot’s 3D model in each view. Task instructions guide masks for the objects and tabletop.

The interactive example shows the protected robot in green and the towel in purple. The source mask also includes a few edge regions. Readers can inspect each mask or hide the overlays.

### “I just want to put this robot and its objects in a new room.”

A room can be six 2D planes: a floor, a ceiling, and four walls. We generate those images once. Then we render the same room from each fixed or wrist camera’s recorded pose, at every moment in the demonstration.

For a surface edit, we anchor a generated texture to the calibrated table plane. As the camera moves, the texture stays attached to the table.

The foldable diagram is a schematic. Each face is an image generated once. Every recorded camera pose selects a view from that same room.

The full pipeline includes robot-mesh projections, SAM 3 masks, a temporal-median reference, and FLUX.2-klein-4B scene generation.

## 30 minutes of video. 28 minutes to augment.

All four camera streams. One node with eight H100s. 104 cup demonstrations.

| Pipeline | Measured wall-clock time |
| --- | ---: |
| Augmentron | 0.47 hours |
| RoboEngine | 8.14 hours |

Measured on the same 30-minute, four-view source set. Augmentron runs at 0.93× source duration. Longer trajectories mainly add rendering and compositing work.

Timing covers cold model construction through local output audit. It excludes queueing, container-image retrieval, credential gates, artifact staging, inter-boot delays, and publication.

Cosmos-Transfer1 takes 10.31 hours for a measured single-view run. The paper extrapolates 23.79 hours for four views; that figure was not measured directly.

## Does the robot improve?

With extra objects on the table, success rises from 18.0% to 45.3% across three tasks. We replaced half the training data with Augmentron edits and kept the data volume and training schedule the same.

We fine-tuned π₀.₅ on cup-on-saucer placement, towel folding, and flower-in-vase insertion. The dataset contains 1,793 real demonstrations and 9.16 hours of recorded data.

### Replace half the data. Keep the volume.

Both models train for 30,000 updates on the same volume of data. Half of the Augmentron recipe remains real; the other half uses room and surface edits. Source episodes are split into disjoint halves, so every demonstration is represented once. The augmented recipe is 50% real, 25% room edits, and 25% surface edits.

| Evaluation | Real only | Augmentron 50/50 |
| --- | ---: | ---: |
| Original setup | 66.7% | 76.7% |
| Added distractors | 18.0% | 45.3% |
| Reflective steel | 50.7% | 67.3% |

In the original setup, pooled success rises from 66.7% to 76.7%. The task-level results are mixed: cup placement falls from 86% to 72%.

Add extra objects to the table, and the real-only baseline falls to 18.0%. Half-augmented training reaches 45.3%. All three tasks improve under distractors.

Replace wood with reflective steel. Pooled success rises from 50.7% to 67.3%. All three tasks improve in this condition.

Only full task completion counts as success. Each pooled result uses 150 rollouts per model and condition, with 50 per task. Each task/recipe uses one training seed.

We changed the room and the surface. We didn’t explicitly insert distractors around the task. The test asks how well that transfers to a different kind of visual shift.

### Keep the real data. Add the augmented data.

All three recipes train for 45k steps. Augmentron uses 3× data volume: real + environment + surface. RoboEngine and Masked Noise use 2×. This comparison evaluates the complete recipes.

| Evaluation | Augmentron 33/67 | RoboEngine | Masked Noise |
| --- | ---: | ---: | ---: |
| Original setup | 71.3% | 57.3% | 68.7% |
| Added distractors | 66.0% | 53.3% | 52.0% |
| Reflective steel | 60.7% | 41.3% | 48.0% |

Augmentron leads in pooled success in all three conditions. Task-level outcomes are mixed. Its data volume is larger than both baselines’. RoboEngine is a generative augmentation baseline. Masked Noise changes unprotected pixels with static, pixelation, blur, blackout, or color jitter. We evaluate the pipeline components together, so these results do not isolate the contribution of each component.

The exploratory 30k Augmentron 33/67 checkpoint comes from a run scheduled for 45k steps. Compared with 50/50 at 30k, pooled distractor success rises from 45.3% to 50.7%, while original-setup and surface success fall. Its data volume and decay schedule differ. These runs do not establish a scaling trend.

Augmentron processes two fixed and two wrist streams. The trained model observes the high fixed view and both wrists. Starting configurations are manually reset and unpaired across models.

### “I need to pick up a flower. I need to put it in the vase.”

Watch two example trials with distractors. The chart summarizes the full evaluation.

Real only: incomplete, progress score 1 of 3. Real + augmented: complete, progress score 3 of 3.

Progress is scored from 0 to 3. A score of 3 counts as task success. These illustrative trials come from the intern presentation and use different manually reset starting configurations.

## There’s still a lot of work to do here.

The matched experiment gives us a useful result: visual variation can help a robot handle a new setup at the same data volume and training schedule.

The gains vary by task. These tests cover three tasks, three visual conditions, and one training seed. Augmentron also needs calibrated cameras, robot geometry, and usable masks. It changes appearance while keeping the recorded behavior.

The next question I’d like to ask: what happens when this goes into pretraining or midtraining?

The experiments here are fine-tuning runs. Larger-scale training remains future work.

## Paper and talk

The downloadable paper contains the final method and complete results. My intern talk tells the story of an earlier version. This page uses the paper’s final method and experimental results.
