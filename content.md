# Augmentron

Scalable Multi-View Visual Augmentation for Robot Learning

Tanay Tandon¹²*, Aseem Doriwala¹*, Jade Choghari¹, Catherine Weaver¹, Pragna Mannam¹

*Equal contribution. ¹ Scale AI. ² University of Pennsylvania.

Accepted to the 8th Robot Learning Workshop: *Is Physical AI Going Zero-Shot?* at NeurIPS 2026.

## We can only collect robot data in so many rooms.

Augmentron asks: can synthetic data help robots generalize?

We want our robots to work in everybody’s homes. Augmentron changes the room or table in an existing demonstration, like folding a towel. It preserves the recorded motion and task objects. We generate the scene once and reuse it across the camera views.

- **18.0% → 45.3%** Success with added distractors. Same training volume and schedule. Three tasks, one seed per task.
- **30 min → 28 min** Source video → processing time. All four streams, on eight H100s.
- **Generate once.** Reuse the scene across fixed and wrist cameras throughout the recording.

## More settings for recorded motion.

Watch the robot and task objects as the rooms and tables change. These clips span cup placement, towel folding, and flower insertion. The wall grows from one augmented video to 49 examples from different recordings.

**1 → 9 → 25 → 49 augmented videos.**

*Replay expansion; Play / Pause; Expansion timeline.*

*Room and table edits across cup, towel, and vase recordings. These early prototype clips cycle through generated appearances. The final method below holds each generated scene fixed through the recording.*

## What shouldn’t change?

The towel and grippers must stay where the recorded motion expects them. We protect those pixels, then edit the room or table around them.

The recorded joint angles and camera calibration place the robot’s 3D model in each view. Task instructions guide masks for the objects and tabletop.

*Protected robot and protected towel overlays on the original frame. Hide masks / Show masks.*

*The original frame, with protected pixels overlaid. The source object mask also includes a few edge regions.*

## Generate a scene once. Reuse it through the recording.

The cameras on the robot’s wrists move with its arms. The generated room should stay put as those cameras move.

We represent the surroundings with six views: a floor, a ceiling, and four walls. We generate those images and a static image of the working area once. Fixed-camera backgrounds are rendered once and reused. Wrist cameras render the surrounding scene from their changing recorded poses.

**One reusable room.**

*Replay unfolding; Play / Pause; Unfolding timeline.*

*A schematic room made from six images. Each face is generated once. A wrist camera selects a view using its recorded pose.*

For a surface edit, we anchor a generated texture to the calibrated table plane. As the camera moves, the texture stays attached to the table. We composite the protected robot and task objects back over the rendered scene.

That reuse is the main idea. Generating the scene assets is a one-time cost. More frames add rendering and compositing work.

### The full pipeline

Robot-mesh projections and SAM 3 masks protect the recorded foreground. A temporal-median reference guides FLUX.2-klein-4B generation of a static working-area image and a six-image cubemap. Rendering and compositing reuse those assets across the trajectory.

## 30 minutes of video. 28 minutes to augment.

We timed the complete pipeline on 104 cup demonstrations: 30 minutes of source video, four camera streams, and one node with eight H100s. Augmentron took 0.47 hours. RoboEngine, a generative augmentation baseline, took 8.14 hours on the same source set.

| Pipeline | Measured wall-clock time |
| --- | ---: |
| Augmentron | 0.47 hours |
| RoboEngine | 8.14 hours |

*Measured wall-clock processing time on the same source data and hardware. Augmentron runs at 0.93× source duration.*

### Timing scope and Cosmos-Transfer1

Timing covers cold model construction through local output audit. It excludes queueing, container-image retrieval, credential gates, artifact staging, inter-boot delays, and publication.

Cosmos-Transfer1 takes 10.31 hours for a measured single-view run. The paper extrapolates 23.79 hours for four views; that four-view figure was not measured directly.

## Does the robot improve?

We fine-tuned π₀.₅, a pretrained robot model, separately for each of three tasks: placing a cup on a saucer, folding a towel, and inserting a flower into a vase. The dataset contains 1,793 real demonstrations and 9.16 hours of recorded data.

In the controlled experiment, we replaced half the training data with Augmentron edits: 50% real, 25% room edits, and 25% surface edits. Both recipes used the same data volume and 30,000 training updates. Each source demonstration was represented once.

**Task success: same data volume and training schedule**

| Test setting | Description | Real only | Augmentron 50/50 |
| --- | --- | ---: | ---: |
| Original setup | Where the data was collected | 66.7% | 76.7% |
| Added distractors | Same task, extra objects | 18.0% | 45.3% |
| Steel surface | Wood replaced with reflective steel | 50.7% | 67.3% |

*Only full task completion counts as success. Each percentage pools 150 rollouts per recipe and condition, with 50 per task. One training seed per task and recipe.*

With extra objects on the table, success rises from **18.0% to 45.3%**, a gain of 27.3 percentage points. We didn’t explicitly insert distractors during augmentation. The gains suggest that changing rooms and surfaces can also help with added clutter.

The gains vary by task. All three tasks improve with distractors and on steel. In the original setup, cup placement falls from 86% to 72%, even though pooled success improves.

The paper also compares larger training recipes. Those runs use different data volumes; the breakdown and full results are below.

### Task results and larger recipes

**Same volume.** Real only and 50/50 share the 30k-update schedule and 1× data volume. Source episodes are split into disjoint halves, so every demonstration is represented once.

**Larger recipes.** All three train for 45k updates. Augmentron uses 3× volume; RoboEngine and Masked Noise use 2×. RoboEngine is a generative augmentation baseline. Masked Noise changes unprotected pixels with static, pixelation, blur, blackout, or color jitter. These comparisons evaluate the complete recipes and do not isolate each pipeline component.

**Exploratory checkpoint.** The 30k Augmentron 33/67 checkpoint comes from a run scheduled for 45k updates. Compared with 50/50 at 30k, pooled distractor success rises from 45.3% to 50.7%, while original-setup and surface success fall. Its data volume and decay schedule differ. These runs do not establish a scaling trend.

**Cameras and trials.** Augmentron processes two fixed and two wrist streams. The trained policies observe the high fixed view and both wrists. Starting configurations are manually reset and unpaired across models. Progress is scored from 0 to 3; only a score of 3 counts as success.

**Physical rollout success rates (%)**

| Updates | Recipe | Volume | Task | Original | Distractors | Steel |
| --- | --- | ---: | --- | ---: | ---: | ---: |
| 30k | Real only | 1× | Cup on saucer | 86 | 16 | 78 |
| 30k | Real only | 1× | Fold a towel | 68 | 26 | 54 |
| 30k | Real only | 1× | Flower in vase | 46 | 12 | 20 |
| 30k | Real only | 1× | Pooled | 66.7 | 18.0 | 50.7 |
| 30k | Augmentron 50/50 | 1× | Cup on saucer | 72 | 52 | 80 |
| 30k | Augmentron 50/50 | 1× | Fold a towel | 88 | 52 | 94 |
| 30k | Augmentron 50/50 | 1× | Flower in vase | 70 | 32 | 28 |
| 30k | Augmentron 50/50 | 1× | Pooled | 76.7 | 45.3 | 67.3 |
| 30k | Augmentron 33/67 (exploratory) | 3× | Cup on saucer | 80 | 76 | 62 |
| 30k | Augmentron 33/67 (exploratory) | 3× | Fold a towel | 80 | 64 | 88 |
| 30k | Augmentron 33/67 (exploratory) | 3× | Flower in vase | 44 | 12 | 26 |
| 30k | Augmentron 33/67 (exploratory) | 3× | Pooled | 68.0 | 50.7 | 58.7 |
| 45k | Augmentron 33/67 | 3× | Cup on saucer | 82 | 74 | 70 |
| 45k | Augmentron 33/67 | 3× | Fold a towel | 72 | 80 | 84 |
| 45k | Augmentron 33/67 | 3× | Flower in vase | 60 | 44 | 28 |
| 45k | Augmentron 33/67 | 3× | Pooled | 71.3 | 66.0 | 60.7 |
| 45k | RoboEngine | 2× | Cup on saucer | 70 | 60 | 78 |
| 45k | RoboEngine | 2× | Fold a towel | 82 | 86 | 40 |
| 45k | RoboEngine | 2× | Flower in vase | 20 | 14 | 6 |
| 45k | RoboEngine | 2× | Pooled | 57.3 | 53.3 | 41.3 |
| 45k | Masked Noise | 2× | Cup on saucer | 86 | 62 | 62 |
| 45k | Masked Noise | 2× | Fold a towel | 94 | 88 | 76 |
| 45k | Masked Noise | 2× | Flower in vase | 26 | 6 | 6 |
| 45k | Masked Noise | 2× | Pooled | 68.7 | 52.0 | 48.0 |

[Download results CSV](https://tanaytan.github.io/augmentron/assets/results.csv)

### Two prototype trials with distractors.

The real-only policy makes some progress. The policy trained with augmented data completes the task. These illustrative trials start from different manually reset configurations; the figure above summarizes the full evaluation.

| Illustrative trial | Outcome |
| --- | --- |
| Real only | Incomplete, progress score 1 of 3 |
| Real + augmented | Complete, progress score 3 of 3 |

*Progress is scored from 0 to 3. Only a score of 3 counts as success. These are separate trials from an earlier prototype evaluation.*

## There’s still a lot of work to do here.

These tests cover three tasks, three visual conditions, and one training seed per task and recipe. Augmentron also needs calibrated cameras, robot geometry, and usable masks. It changes appearance while keeping the recorded behavior.

The next question I’d like to ask: what happens when this goes into pretraining or midtraining? The experiments here are fine-tuning runs. Larger-scale training remains future work.

## Read the paper.

Accepted to the 8th Robot Learning Workshop: *Is Physical AI Going Zero-Shot?* at NeurIPS 2026.

[Download paper](https://tanaytan.github.io/augmentron/assets/paper/augmentron.pdf)

### Cite the work

```bibtex
@misc{tandon2026augmentron,
  title = {Augmentron: Scalable Multi-View Visual
           Augmentation for Robot Learning},
  author = {Tandon, Tanay and Doriwala, Aseem and
            Choghari, Jade and Weaver, Catherine and
            Mannam, Pragna},
  year = {2026},
  note = {Accepted to the 8th Robot Learning Workshop
          at NeurIPS 2026},
  url = {https://tanaytan.github.io/augmentron/}
}
```
