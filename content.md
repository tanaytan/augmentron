# Augmentron

Scalable Multi-View Visual Augmentation for Robot Learning

Tanay Tandon¹²*, Aseem Doriwala¹*, Jade Choghari¹, Catherine Weaver¹, Pragna Mannam¹

*Equal contribution. ¹ Scale AI. ² University of Pennsylvania.

Accepted to the 8th Robot Learning Workshop: *Is Physical AI Going Zero-Shot?* at NeurIPS 2026.

## We can only collect robot data in so many rooms.

Thus, we ask if synthetic data augmentation can help robots generalize?

Augmentron starts with a demonstration we already have and gives it a different visual setting. The same towel fold can appear in a new room or against a different table surface, while the robot, towel, instructions, and recorded actions stay intact. To make that edit agree across fixed cameras and moving wrist views, we generate the scene once, then render it from the recorded camera poses throughout the demonstration.

- **Generalization · 18.0% → 45.3%** Success with distractors.<br>Real only → Augmentron.

- **Efficiency · 17× faster** Than RoboEngine.<br>Same data and hardware.

- **Scalability · Generate once.** One scene per recording.<br>Shared across cameras.

## Augmenting real demonstrations.

*Replay expansion; Play / Pause; Expansion timeline.*

**Multi-view consistent · 1×**

GPU-hours / video-hour

## How does this work?

The recorded actions only make sense if the robot and the objects it handles remain unchanged. That gives us a boundary for the edit: preserve those regions, then change the surroundings or the table surface.

### Start with what must stay.

A mask marks the pixels to preserve. For towel folding, that means the towel and robot, including the grippers. After rendering the new setting, we place these original pixels back over it.

Recorded joint angles tell us how to position the robot’s 3D model; camera calibration tells us where it appears in each image. Projecting that model gives us the robot mask. The task instructions guide segmentation of the objects and tabletop.

*Protected robot; Protected towel. Hide masks / Show masks.*

*Masks over the original towel-folding frame. The object mask includes a few extra regions along the edges.*

### Give the cameras one room to look at.

A wrist camera can look down at the table, then turn toward the ceiling as the arm moves. Those views need to belong to the same room.

We reduce the room to six faces: a floor, a ceiling, and four walls. An image for each face, plus a static image of the working area, gives us a scene to reuse. Each fixed camera reuses its rendered background. For each wrist frame, the recorded camera pose tells us how to render a view of that same scene.

**One reusable room**

*Replay unfolding; Play / Pause; Unfolding timeline.*

*Front wall; Back wall; Left wall; Right wall; Ceiling; Floor. Recorded camera.*

*Plays here as you scroll. Drag the timeline to rewind.*

*This schematic shows the six-image room representation. The recorded wrist-camera pose determines which part of it appears in a frame.*

In this example from the paper, all four cameras look into the generated room from their recorded poses.

*High fixed; Low fixed; Left wrist; Right wrist.*

*The paper’s room edit keeps the wooden table, robot, and blue towel inside new surroundings. [View full-resolution frame ↗](https://tanaytan.github.io/augmentron/assets/images/method/paper-environment-four-views.png)*

### Anchor the new texture to the table.

For a surface edit, we project a generated texture onto the calibrated table plane, so it stays attached to the surface as the wrists move. The protected robot and task objects go back over the rendered texture.

*High fixed; Low fixed; Left wrist; Right wrist.*

*The paper’s surface edit changes the tabletop in each view while preserving the robot and towel. [View full-resolution frame ↗](https://tanaytan.github.io/augmentron/assets/images/method/paper-surface-four-views.png)*

### The full pipeline

Robot-mesh projections and SAM 3 segmentation identify the protected foreground. To recover the static scene, we exclude those pixels from sampled frames and take the median at each image location. This reference guides FLUX.2-klein-4B, which generates a working-area image and a six-image cubemap. We render these assets through the recorded camera poses and composite the original foreground over them.

## Efficiency.

**The expensive part happens once per recording.**

An image model can edit each frame, or a video model can edit a clip at a time. Both keep generative inference tied to how much footage we want to augment. Across four cameras, that cost adds up quickly.

Augmentron generates the room and surface assets once, then renders and composites them throughout the recording. Longer demonstrations add more of that cheaper work, while all four cameras share the same generated appearance.

| Once per recording | For each frame |
| --- | --- |
| **Generate scene assets** | **Render and composite** |
| Keep the generated appearance for the full recording. | Render from the camera pose and restore the protected pixels. |

*Generate the appearance once; render it along the recorded motion.*

Some segmentation work can be shared too. We reuse stable fixed-camera surface masks and estimate some masks by tiling four frames into one image. Wrist-camera objects still need a separate mask for each view and frame.

For the benchmark, we used 104 cup demonstrations totaling 30 minutes, with four camera streams on one node with eight H100s. The complete Augmentron pipeline took 0.47 hours. RoboEngine, a generative augmentation baseline, took 8.14 hours with the same data and hardware. That makes Augmentron about 17× faster in this benchmark.

| Pipeline | Measured wall-clock time |
| --- | ---: |
| Augmentron | 0.47 hours |
| RoboEngine | 8.14 hours |

*Measured wall-clock time for the two pipelines on the same data and hardware. Augmentron’s processing time is 0.93× the source-video duration.*

### Timing scope and Cosmos-Transfer1

The clock starts with cold model construction and stops after the local output audit. Queueing, container-image retrieval, credential and GPU gates, artifact staging, inter-boot delays, and publication fall outside this measurement.

A single-view Cosmos-Transfer1 run took 10.31 hours. Extrapolating its per-view stages gives 23.79 hours for four views. The paper reports that estimate separately from the measured runs.

## Does the robot improve?

None of the above matters unless the robot improves.

Our dataset contains 1,793 real demonstrations, or 9.16 hours, across placing a cup on a saucer, folding a towel, and inserting a flower into a vase. For each task, we fine-tuned a separate policy from π₀.₅, a pretrained robot model. Augmentron processes all four camera streams; the policies see the high fixed view and both wrists.

The controlled experiment replaces half the training data with edits: 50% real demonstrations, 25% room edits, and 25% surface edits. Every source demonstration appears once. This keeps data volume and the 30,000-update training schedule matched to real-only training. We then test both policies in the original setup, with unrelated objects added, and with reflective steel covering the wooden surface.

**Task success: same data volume and training schedule**

| Test setting | Description | Real only | Augmentron 50/50 |
| --- | --- | ---: | ---: |
| Original setup | Where the data was collected | 66.7% | 76.7% |
| Added distractors | Same task, extra objects | 18.0% | 45.3% |
| Steel surface | Wood replaced with reflective steel | 50.7% | 67.3% |

*Each percentage pools 150 physical rollouts per recipe and condition, with 50 for each task. Success requires completing the whole task. There is one training seed per task and recipe.*

The largest pooled gain appears in the distractor test: success rises from **18.0% to 45.3%**, or 27.3 percentage points. We didn’t explicitly insert distractors during augmentation. The room and surface edits appear to help the robot handle added clutter too.

Looking at individual tasks changes the picture. All three improve with distractors and on steel, but cup placement in the original setup falls from 86% to 72%. The pooled improvement hides that tradeoff.

The paper also tests recipes that keep the full real corpus and add augmented data. Their volumes differ, so the full results below need to be read with those differences in mind.

### Task results and larger recipes

**Same volume.** Real only and Augmentron 50/50 use 1× data volume and the same 30k-update schedule. For 50/50, disjoint source-episode halves supply the real and edited data, keeping every demonstration represented once.

**Larger recipes.** At 45k updates, Augmentron uses 3× data volume, while RoboEngine and Masked Noise each use 2×. RoboEngine generates visual edits. Masked Noise applies static, pixelation, blur, blackout, or color jitter outside protected regions. These runs compare complete recipes; they leave the effects of data volume and individual pipeline components unresolved.

**Exploratory checkpoint.** The 30k Augmentron 33/67 checkpoint belongs to a run scheduled for 45k updates. It raises pooled distractor success from 45.3% to 50.7% relative to 50/50 at 30k, while success falls in the original setup and on steel. With both data volume and the decay schedule changed, this comparison cannot establish a scaling trend.

**Cameras and trials.** The pipeline processes two fixed and two wrist streams; policies observe the high fixed view and both wrists. Operators manually reset the starting configurations, which are unpaired across models. Rollout progress ranges from 0 to 3, and only 3 counts as success.

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

### What two prototype trials look like.

The real-only policy makes partial progress. The policy trained with augmented data completes the task. The clips show the behavior from different manually reset starting configurations. For the full evaluation, look to the chart above.

| Illustrative trial | Outcome |
| --- | --- |
| Real only | Incomplete, progress score 1 of 3 |
| Real + augmented | Complete, progress score 3 of 3 |

*Examples play when this figure enters view. Replay both trials.*

*Two separate trials from the earlier prototype evaluation. A score of 1 marks partial progress; 3 marks completion and counts as success.*

## There’s still a lot of work to do here.

The biggest next step for augmentation quality is better segmentation. A wrist camera may see a gripper and a flower stem, with the petals out of view. To edit the flower consistently, we need to keep track of which pixels belong to it. I’d start by fine-tuning a segmentation model on these robot views. Better masks would improve the current edits and make changes to the task objects themselves more feasible.

Three tasks and three visual conditions give us a useful first test. With one training seed per task and recipe, we still need to learn how much these results vary across training runs. The pipeline also depends on camera calibration, robot geometry, and usable masks. Its edits broaden the visual settings around a behavior we already recorded.

I’d next like to see what happens when this data goes into pretraining or midtraining. These experiments only test fine-tuning. Can the same reuse of recorded behavior help at that larger scale?

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
