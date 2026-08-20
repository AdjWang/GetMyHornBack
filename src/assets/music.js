
const MUSIC_BACKGROUND = [
    // Instruments: soft piano-ish A, 1 second body and short release.
    [[.4, 0, 440, .02, .8, .18, 0, 1.5]],
    // Pattern: instrument 0, center pan, A note then 1 second silence.
    [[[0, 0, 12, 0, 0, 0, 0, 0, 0, 0]]],
    [0],  // Sequence: loop the only pattern.
    60,   // BPM: each 4 beats is about 1 second.
];

const BACKGROUND_MUSIC = [                                     // Song
  [                                     // Instruments
    // [.9, 0, 143, , , .35, 3],             // Instrument 0
    [.4, 0, 440, .02, .8, .18, 0, 1.5],
    [1, 0, 216, , , .45, 1, 4, , ,50],    // Instrument 1
    [.75, 0, 196, , .08, .18, 3]          // Instrument 2
  ],
  [                                     // Patterns
    [                                     // Pattern 0
      [                                     // Channel 0
        1,                                    // Using instrument 0
        -1,                                   // From the left speaker
        1,                                    // play C-1
        0, 0, 0,                              // rest (x3)
        // 3.5,                                  // play E-1 with 50% attenuation
        // 0, 0, 0                               // rest (x3)
      ],
      // [                                     // Channel 1
      //   1,                                    // Using instrument 1
      //   1,                                    // From the right speaker
      //   2,                                    // play D-1
      //   2.25,                                 // play D-1 with 25% attenuation
      //   3.5,                                  // Play E-1 with 50% attenuation
      //   4.75,                                 // Play F-1 with 75% attenuation
      //   -1,                                   // Release the note
      //   0, 0, 0                               // rest (x3)
      // ]
    ]
  ],
  [                                     // Sequence
    0,                                    // Play pattern 0
    // 0,                                    // ...and again
  ],
  120,                                  // 120 BPM
  {                                     // Metadata
    title: "My Song",                      // Name of the song
    author: "Keith Clark"                  // Name of the author/composer
  }
]
