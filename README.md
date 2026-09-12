# Get My Horn Back

An action-puzzle platformer for [js13k 2026](https://js13kgames.com/2026/).

## The story

"The horn is the key to rainbow power, whoever has it dominates the world. It's really a heavy responsibility to own it, I need to relax, so just let me take a nap... Wait, what?! Hey! GET MY HORN BACK!!"

Embark on an adventure to take the horn back. Becareful, the evil dragon now is able to fire rainbow beam!

## Controls

- <kbd>S</kbd>: Start game.
- <kbd>W</kbd>/<kbd>A</kbd>/<kbd>D</kbd> or <kbd>ArrowUp</kbd>/<kbd>ArrowLeft</kbd>/<kbd>ArrowRight</kbd>: Jump and move.
- <kbd>R</kbd>: Reset to last savepoint.
- <kbd>B</kbd>: Clear all savepoints.

## Setup

### Build and pack

```
npm install .
npm run build
```

> The output size is not so stable, you may have to build multiple times to get an ideal size.

<details>
<summary>Example build output</summary>

```
> GetMyHornBack@0.0.0 build
> node src/build.mjs

Building game...
Feature disabled: webgl
Feature disabled: touch
Feature disabled: gamepad
Running closure compiler...
Running uglify...
Running roadroller...
(initial) -Sx12: 12155 <-
(modelRecipBaseCount 0.0%) -Zmd10 -Sx12: 12161 x
(modelRecipBaseCount 25.0%) -Zmd20 -Sx12: 12155 x
(modelRecipBaseCount 50.0%) -Zmd50 -Sx12: 12176 x
(modelRecipBaseCount 75.0%) -Zmd100 -Sx12: 12211 x
(modelMaxCount 0.0%) -Zmc4 -Sx12: 12163 x
(modelMaxCount 33.3%) -Zmc5 -Sx12: 12155 x
(modelMaxCount 66.7%) -Zmc6 -Sx12: 12157 x
(dynamicModels 0.0%) -Zdy0 -Sx12: 12141 <-
(dynamicModels 50.0%) -Zdy1 -Sx12: 12155 x
(numAbbreviations 0.0%) -Zab0 -Zdy0 -Sx12: 12435 x
(numAbbreviations 25.0%) -Zab16 -Zdy0 -Sx12: 12196 x
(numAbbreviations 50.0%) -Zab32 -Zdy0 -Sx12: 12129 <-
(numAbbreviations 75.0%) -Zab64 -Zdy0 -Sx12: 12141 x
(sparseSelectors 0.0%) -Zab32 -Zdy0 -S0,2,3,6,7,13,21,25,42,50,57,480: 12663 x
(sparseSelectors 9.5%) -Zab32 -Zdy0 -S0,1,2,3,6,7,13,21,25,42,50,458: 12111 <-
(sparseSelectors 19.1%) -Zab32 -Zdy0 -S0,1,2,3,6,7,13,25,42,50,124,458: 12119 x
(sparseSelectors 28.6%) -Zab32 -Zdy0 -S0,1,2,3,6,7,13,25,42,50,427,458: 12113 
(sparseSelectors 38.2%) -Zab32 -Zdy0 -S0,1,2,3,6,7,13,42,50,122,427,458: 12154 x
(sparseSelectors 47.7%) -Zab32 -Zdy0 -S0,1,2,3,6,7,13,42,50,427,457,458: 12138 x
(sparseSelectors 57.2%) -Zab32 -Zdy0 -S0,1,2,3,6,7,25,42,50,239,427,458: 12186 x
(sparseSelectors 66.8%) -Zab32 -Zdy0 -S0,1,2,3,7,13,25,42,50,283,427,458: 12135 x
(sparseSelectors 76.3%) -Zab32 -Zdy0 -S0,1,2,3,6,7,13,25,42,50,348,427: 12106 <-
(sparseSelectors 85.9%) -Zab32 -Zdy0 -S0,1,3,6,7,13,25,42,50,200,348,427: 12123 x
(sparseSelectors 95.4%) -Zab32 -Zdy0 -S1,2,3,6,7,13,25,42,50,218,348,427: 12233 x
(precision 0.0%) -Zab32 -Zdy0 -Zpr12 -S0,1,2,3,6,7,13,25,42,50,348,427: 12089 <-
(precision 33.3%) -Zab32 -Zdy0 -Zpr14 -S0,1,2,3,6,7,13,25,42,50,348,427: 12088 <-
(precision 66.7%) -Zab32 -Zdy0 -Zpr16 -S0,1,2,3,6,7,13,25,42,50,348,427: 12106 x
(recipLearningRate 0.0%) -Zab32 -Zdy0 -Zlr500 -Zpr14 -S0,1,2,3,6,7,13,25,42,50,348,427: 12088 x
(recipLearningRate 20.0%) -Zab32 -Zdy0 -Zlr750 -Zpr14 -S0,1,2,3,6,7,13,25,42,50,348,427: 12058 <-
(recipLearningRate 40.0%) -Zab32 -Zdy0 -Zlr1000 -Zpr14 -S0,1,2,3,6,7,13,25,42,50,348,427: 12047 <-
(recipLearningRate 60.0%) -Zab32 -Zdy0 -Zlr1250 -Zpr14 -S0,1,2,3,6,7,13,25,42,50,348,427: 12042 <-
(recipLearningRate 80.0%) -Zab32 -Zdy0 -Zlr1500 -Zpr14 -S0,1,2,3,6,7,13,25,42,50,348,427: 12041 <-
search done in 4.4s, use `-Zab32 -Zdy0 -Zlr1500 -Zpr14 -S0,1,2,3,6,7,13,25,42,50,348,427` to replicate: 12041 (estimated, 76.78% smaller)
Building html...
Zipping...
Processed 2 files
Saved 4.02KB out of 17.00KB (23.6443%)

Build completed in 8.38 seconds!
game.zip: 13292 / 13312 bytes (99.8%)
20 bytes remaining
```
</details>

### Update character data

Character resource layout is converted to `resourceLoader.js` through AI chat bot from aseprite generated `assets/character.json`.

### Update level data

```
npm run watch:level
```

There's a `convertLevelData.mjs` that automatically scan and convert all `.tmx` files under `assets/tiled` to arrays in `level.js`. Run this command in background to enable level data auto-reload when saving `tmx` file.

> To reload only once, run `npm run build:level`

## Tools

Thanks to tools powered up this game:

- [LittleJS Engine - Special JS13k Branch](https://github.com/KilledByAPixel/LittleJS/tree/js13k)

- [Tiled](https://www.mapeditor.org/)

- [Aseprite](https://www.aseprite.org/)
