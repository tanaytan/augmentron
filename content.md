# Augmentron

Scalable Multi-View Visual Augmentation for Robot Learning

Tanay Tandon¹²*, Aseem Doriwala¹*, Jade Choghari¹, Catherine Weaver¹, Pragna Mannam¹

*Equal contribution. ¹ Scale AI. ² University of Pennsylvania.

Accepted to the 8th Robot Learning Workshop: *Is Physical AI Going Zero-Shot?* at NeurIPS 2026.

## We can only collect robot data in so many rooms.

Can synthetic data augmentation help robots generalize?

We take a recorded demonstration and change the room or table around it. The robot, task objects, and recorded actions stay the same. Augmentron generates a scene once, then reuses it across the recording’s fixed and wrist cameras.

- **Generalization · 18.0% → 45.3%** Success with added distractors. Real only → Augmentron 50/50. Same volume and schedule. Three tasks, one seed per task.
- **Efficiency · 30 min → 28 min** Source video → processing time. All four streams, on eight H100s.
- **Scalability · Generate once.** Reuse the scene across fixed and wrist cameras throughout the recording.

## Augmenting real demonstrations.

These are recorded demonstrations with edited rooms and table surfaces. Each tile shows four synchronized cameras: the high and low fixed views above, and the left and right wrists below. The robot still folds the towel, places the cup, or inserts the flower. The wall expands to show examples across our recordings.

**Four views per recording**

*Replay expansion; Play / Pause; Expansion timeline.*

*Plays here as you scroll. Drag the timeline to rewind.*

**Four views. One pipeline. · 0.93×**

Processing time / source duration. Final pipeline benchmark · eight H100s.

*The wall includes room and table edits from different recordings, shown through all four cameras. These early prototype clips cycle through appearances. The final method holds each generated scene fixed. The timing callout reports the final pipeline’s measured runtime.*

## How does this work?

We split the image into what should stay and what can change. The robot and task objects stay. The room and table surface can change.

### Keep the robot and task objects.

The towel and grippers must stay where the recorded motion expects them. We protect those pixels with masks, then composite them over the edited scene.

The recorded joint angles and camera calibration place the robot’s 3D model in each view. Task instructions guide masks for the objects and tabletop.

*Protected robot; Protected towel. Hide masks / Show masks.*

*The original frame, with protected pixels overlaid. The source object mask also includes a few edge regions.*

### Change the room.

The cameras on the robot’s wrists move with its arms. The generated room should stay put as those cameras move.

We represent the room with six faces: a floor, a ceiling, and four walls. We generate an image for each face and a static image of the working area once. Fixed-camera backgrounds are rendered once and reused. Wrist cameras render the surrounding scene from their changing recorded poses.

**One reusable room.**

*Replay unfolding; Play / Pause; Unfolding timeline.*

*Front wall; Back wall; Left wall; Right wall; Ceiling; Floor. Recorded camera.*

*Plays here as you scroll. Drag the timeline to rewind.*

*A schematic room made from six images. Each face is generated once. A wrist camera selects a view using its recorded pose.*

Here is a room edit from the paper. Each camera sees the generated surroundings from its own pose.

*High fixed; Low fixed; Left wrist; Right wrist.*

*Room augmentation from the paper. The surroundings change; the wooden working surface, robot, and towel are retained.* [View full-resolution frame ↗](https://tanaytan.github.io/augmentron/assets/images/method/paper-environment-four-views.png)

### Change the table.

For a surface edit, we anchor a generated texture to the calibrated table plane. As the camera moves, the texture stays attached to the table. We composite the protected robot and task objects back over the rendered scene.

*High fixed; Low fixed; Left wrist; Right wrist.*

*Surface augmentation from the paper. The generated texture follows the table geometry in each view. The robot and towel are retained.* [View full-resolution frame ↗](https://tanaytan.github.io/augmentron/assets/images/method/paper-surface-four-views.png)

### The full pipeline

Robot-mesh projections and SAM 3 masks protect the recorded foreground. A temporal-median reference guides FLUX.2-klein-4B generation of a static working-area image and a six-image cubemap. Rendering and compositing reuse those assets across the trajectory.

## Efficiency.

**30 minutes of video. 28 minutes to augment.**

Generating the scene is a one-time cost. We reuse those assets throughout the recording. Fixed cameras reuse the same rendered background. Wrist cameras render the scene from their changing poses.

| Once per recording | For each frame |
| --- | --- |
| **Generate scene assets** | **Render and composite** |
| The room and table appearance serve the full trajectory. | Use the camera pose. Restore the protected pixels. |

*Generation is shared across the recording. Rendering follows the recorded motion.*

We also share segmentation work. Stable fixed-camera surface masks can be reused. For some masks, we tile four frames together and segment them in one pass. Moving wrist-camera objects still need per-frame masks.

We timed the complete pipeline on 104 cup demonstrations: 30 minutes of source video, four camera streams, and one node with eight H100s. Augmentron took 0.47 hours. RoboEngine, a generative augmentation baseline, took 8.14 hours on the same source set.

| Pipeline | Measured wall-clock time |
| --- | ---: |
| Augmentron | 0.47 hours |
| RoboEngine | 8.14 hours |

*Measured wall-clock processing time on the same source data and hardware. Augmentron runs at 0.93× source duration.*

### Timing scope and Cosmos-Transfer1

Timing covers cold model construction through local output audit. It excludes queueing, container-image retrieval, credential and GPU gates, artifact staging, inter-boot delays, and publication.

Cosmos-Transfer1 takes 10.31 hours for a measured single-view run. The paper extrapolates 23.79 hours for four views; that four-view figure was not measured directly.

## Does the robot improve?

None of the above matters unless the robot improves.

We fine-tuned π₀.₅, a pretrained robot model, separately for each of three tasks: placing a cup on a saucer, folding a towel, and inserting a flower into a vase. The dataset contains 1,793 real demonstrations and 9.16 hours of recorded data. The pipeline processes all four cameras; the trained policies observe the high fixed view and both wrists.

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

*On a small screen, scroll the table sideways.*

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

*Examples play when this figure enters view. Replay both trials.*

*Progress is scored from 0 to 3. Only a score of 3 counts as success. These are separate trials from an earlier prototype evaluation.*

## There’s still a lot of work to do here.

These tests cover three tasks, three visual conditions, and one training seed per task and recipe. Augmentron also needs calibrated cameras, robot geometry, and usable masks. It changes appearance while keeping the recorded behavior.

The next question I’d like to ask: what happens when this goes into pretraining or midtraining? The experiments here are fine-tuning runs. Larger-scale training remains future work.

## Read the paper.

Accepted to the 8th Robot Learning Workshop: *Is Physical AI Going Zero-Shot?* at NeurIPS 2026.

[Download paper](https://tanaytan.github.io/augmentron/assets/paper/augmentron.pdf)

### Cite the work

*Copy BibTeX.*

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

*Reduce motion.* [Website source](https://github.com/tanaytan/augmentron)
