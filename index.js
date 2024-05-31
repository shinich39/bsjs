'use strict';

import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from 'node:url';
import wav from './libs/wav.js';
import jsu from './libs/jsu.js';
import ffmpeg from "fluent-ffmpeg";
import jsmediatags from 'jsmediatags';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TMP_PATH = path.join(__dirname, "tmp");
const COVER_PATH = path.join(__dirname, "cover.jpg");
const OUTPUT_PATH = path.join(__dirname, "output");

const INFO_VERSION = '2.1.0';
const BPM_INFO_VERSION = '2.0.0';
const MAP_VERSION = '3.0.0';
const PREVIEW_START_TIME = 10;
const PREVIEW_DURATION = 30;
const START_OFFSET = 2.5;
const BACKGROUND_SPACING = 5;
const ENABLE_BEAT_SPACING = true;
const CROSS_POSITION_RATE = 0.05; // 0: disable
const LESS_TOP_POSITION_LIMIT = -1; // -1: disable
const LESS_CENTER_FACTOR_LIMIT = 1; // -1: disable
const DIFFICULTY_OPTIONS = {
  easy: {
    bufferSize: 0.5,
    minVolume: 0.7,
    energeThreshold: 1.5,
    noteSpawnRates: [0.5, 0.1],
    bombSpawnRate: 0,
    obstacleSpawnRate: 0.02,
    sliderSpawnRate: 0.5,
    beatSpacing: 1,
    noteSpacing: 1.5,
    sliderRange: [2.5, 5],
    noteConnectSpacing: 2.5,
    obstacleSpacing: 25,
    obstacleDisappearSpacing: 0.5,
    bombDisappearSpacing: 0.5,
  },
  normal: {
    bufferSize: 0.5,
    minVolume: 0.4,
    energeThreshold: 1.5,
    noteSpawnRates: [0.75, 0.125],
    bombSpawnRate: 0,
    obstacleSpawnRate: 0.02,
    sliderSpawnRate: 0.5,
    beatSpacing: 0.5,
    noteSpacing: 1,
    sliderRange: [2, 5],
    noteConnectSpacing: 2.25,
    obstacleSpacing: 20,
    obstacleDisappearSpacing: 0.5,
    bombDisappearSpacing: 0.5,
  },
  hard: {
    bufferSize: 0.5,
    minVolume: 0.1,
    energeThreshold: 1.5,
    noteSpawnRates: [0.75, 0.25],
    bombSpawnRate: 0,
    obstacleSpawnRate: 0.03,
    sliderSpawnRate: 0.5,
    beatSpacing: 0.25,
    noteSpacing: 0.5,
    sliderRange: [1.5, 5],
    noteConnectSpacing: 2,
    obstacleSpacing: 15,
    obstacleDisappearSpacing: 0.5,
    bombDisappearSpacing: 0.5,
  },
  expert: {
    bufferSize: 0.35,
    minVolume: 0.1,
    energeThreshold: 1.5,
    noteSpawnRates: [0.75, 0.375],
    bombSpawnRate: 0,
    obstacleSpawnRate: 0.04,
    sliderSpawnRate: 0.5,
    beatSpacing: 0.25,
    noteSpacing: 0.25,
    sliderRange: [1.25, 5],
    noteConnectSpacing: 1.5,
    obstacleSpacing: 12.5,
    obstacleDisappearSpacing: 0.5,
    bombDisappearSpacing: 0.5,
  },
  expertPlus: {
    bufferSize: 0.25,
    minVolume: 0.1,
    energeThreshold: 1.5,
    noteSpawnRates: [0.75, 0.5],
    bombSpawnRate: 0,
    obstacleSpawnRate: 0.05,
    sliderSpawnRate: 0.7,
    beatSpacing: 0.25,
    noteSpacing: 0.25,
    sliderRange: [1.25, 5],
    noteConnectSpacing: 1.5,
    obstacleSpacing: 10,
    obstacleDisappearSpacing: 0.5,
    bombDisappearSpacing: 0.5,
  },
}

const ENVIRONMENTS = [
  "DefaultEnvironment",
  "TriangleEnvironment",
  "NiceEnvironment",
  "BigMirrorEnvironment",
  "KDAEnvironment",
  "MonstercatEnvironment",
  "CrabRaveEnvironment",
  "DragonsEnvironment",
  "OriginsEnvironment",
  "PanicEnvironment",
  "RocketEnvironment",
  "GreenDayEnvironment",
  "GreenDayGrenadeEnvironment",
  "TimbalandEnvironment",
  "FitBeatEnvironment",
  "LinkinParkEnvironment",
  "BTSEnvironment",
  "KaleidoscopeEnvironment",
  "InterscopeEnvironment",
  "SkrillexEnvironment",
  "BillieEnvironment",
  "HalloweenEnvironment",
  "GagaEnvironment",
  // "GlassDesertEnvironment",
  // "WeaveEnvironment",
  // "PyroEnvironment",
  // "EDMEnvironment",
  // "TheSecondEnvironment",
  // "LizzoEnvironment",
  // "TheWeekndEnvironment",
  // "RockMixtapeEnvironment",
  // "Dragons2Environment",
  // "Panic2Environment",
  // "QueenEnvironment",
];

const POSITIONS = [
  0,1, 2, 3,
  4,5, 6, 7,
  8,9,10,11,
];

const DIRECTIONS = [
  0,1,2,
  3,4,5,
  6,7,8,
];

const REVERSE_DIRECTIONS = [
  8,7,6,
  5,4,3,
  2,1,0,
];

const NOTE_POSITIONS = [
  {x: 0, y: 2}, {x: 1, y: 2}, {x: 2, y: 2}, {x: 3, y: 2},
  {x: 0, y: 1}, {x: 1, y: 1}, {x: 2, y: 1}, {x: 3, y: 1},
  {x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 0}, {x: 3, y: 0},
];

const NOTE_DIRECTIONS = [
  {d: 4}, {d: 0}, {d: 5},
  {d: 2}, {d: 8}, {d: 3},
  {d: 6}, {d: 1}, {d: 7},
];

// for connect left note
const LEFT_POSITION_COUNT = [
  3, 2,1,
  4,12,1,
  3, 2,1,
];

// for connected right note
const RIGHT_POSITION_COUNT = [
  1, 2,3,
  1,12,4,
  1, 2,3,
];

const NEW_POSITION_DIRECTION_CASES = [
  [8,8,8,8,5,7], [7,7,7,7,6,8], [6,6,6,6,3,7],
  [5,5,5,5,2,8], [4,4,4,4,4,4], [3,3,3,3,0,6],
  [2,2,2,2,1,5], [1,1,1,1,0,2], [0,0,0,0,1,3],
];

const SAME_POSITION_DIRECTION_CASES = [
  [8], [7], [6],
  [5], [4], [3],
  [2], [1], [0],
];

const NEW_DIRECTION_CASES = [
  [0,0,8], [1,1,7], [2,2,6],
  [3,3,5], [4,4,4], [5,5,3],
  [6,6,2], [7,7,1], [8,8,0],
];

const SLIDER_TAIL_DIRECTION_CASES = [
  [8,5,7], [7,6,8],             [6,3,7],
  [5,2,8], [0,1,2,3,4,5,6,7,8], [3,0,6],
  [2,1,5], [1,0,2],             [0,1,3],
];

// for disconnected left note
// [
//   4,3,1,0,
//   5,0,0,0,
//   4,3,1,0,
// ]
const LEFT_NOTE_FORMATS = [
  // top
  // [0,0], [0,1], [0,3],
  [0,0], [0,1], [0,3],
  [0,0], [0,1], [0,3],
  [0,0], [0,1], [0,3],
  [0,0], [0,1], [0,3],

  // [1,1], [1,2], [1,5],
  [1,1], [1,2], [1,5],
  [1,1], [1,2], [1,5],
  [1,1], [1,2], [1,5],

  // [2,1], [2,2], [2,5],
  [2,1], [2,2], [2,5],

  // [3,1], [3,2], [3,5],

  // middle
  // [4,0], [4,3], [4,6],
  [4,0], [4,3], [4,6],
  [4,0], [4,3], [4,6],
  [4,0], [4,3], [4,6],
  [4,0], [4,3], [4,6],
  [4,0], [4,3], [4,6],

  // [5,2], [5,5], [5,8],

  // [6,2], [6,5], [6,8],

  // [7,2], [7,5], [7,8],

  // bottom
  // [8,3], [8,6], [8,7],
  [8,3], [8,6], [8,7],
  [8,3], [8,6], [8,7],
  [8,3], [8,6], [8,7],
  [8,3], [8,6], [8,7],

  // [9,5], [9,7], [9,8],
  [9,5], [9,7], [9,8],
  [9,5], [9,7], [9,8],
  [9,5], [9,7], [9,8],

  // [10,5], [10,7], [10,8],
  [10,5], [10,7], [10,8],

  // [11,5], [11,7], [11,8],
];

// for disconnected right note
// [
//   0,1,3,4,
//   0,0,0,5,
//   0,1,3,4,
// ]
const RIGHT_NOTE_FORMATS = [
  // top
  // [0,0], [0,1], [0,3],

  // [1,0], [1,1], [1,3],
  [1,0], [1,1], [1,3],

  // [2,0], [2,1], [2,3],
  [2,0], [2,1], [2,3],
  [2,0], [2,1], [2,3],
  [2,0], [2,1], [2,3],

  // [3,1], [3,2], [3,5],
  [3,1], [3,2], [3,5],
  [3,1], [3,2], [3,5],
  [3,1], [3,2], [3,5],
  [3,1], [3,2], [3,5],

  // middle
  // [4,0], [4,3], [4,6],

  // [5,0], [5,3], [5,6],

  // [6,0], [6,3], [6,6],

  // [7,2], [7,5], [7,8],
  [7,2], [7,5], [7,8],
  [7,2], [7,5], [7,8],
  [7,2], [7,5], [7,8],
  [7,2], [7,5], [7,8],
  [7,2], [7,5], [7,8],
  
  // bottom
  // [8,3], [8,6], [8,7],

  // [9,3], [9,6], [9,7],
  [9,3], [9,6], [9,7],

  // [10,3], [10,6], [10,7],
  [10,3], [10,6], [10,7],
  [10,3], [10,6], [10,7],
  [10,3], [10,6], [10,7],

  // [11,5], [11,7], [11,8],
  [11,5], [11,7], [11,8],
  [11,5], [11,7], [11,8],
  [11,5], [11,7], [11,8],
  [11,5], [11,7], [11,8],
];

const OBSTACLE_FORMATS = [
  {x: 0, y: 0, w: 1, h: 4, d: 5}, // left
  {x: 0, y: 0, w: 1, h: 4, d: 5}, // left
  {x: 0, y: 0, w: 1, h: 4, d: 5}, // left
  {x: 0, y: 0, w: 2, h: 4, d: 5}, // left
  {x: 3, y: 0, w: 1, h: 4, d: 5}, // right
  {x: 3, y: 0, w: 1, h: 4, d: 5}, // right
  {x: 3, y: 0, w: 1, h: 4, d: 5}, // right
  {x: 2, y: 0, w: 2, h: 4, d: 5}, // right

  {x: 0, y: 0, w: 1, h: 4, d: 7}, // left
  {x: 0, y: 0, w: 1, h: 4, d: 7}, // left
  {x: 0, y: 0, w: 1, h: 4, d: 7}, // left
  {x: 0, y: 0, w: 2, h: 4, d: 7}, // left
  {x: 3, y: 0, w: 1, h: 4, d: 7}, // right
  {x: 3, y: 0, w: 1, h: 4, d: 7}, // right
  {x: 3, y: 0, w: 1, h: 4, d: 7}, // right
  {x: 2, y: 0, w: 2, h: 4, d: 7}, // right

  {x: 0, y: 0, w: 1, h: 4, d: 9}, // left
  {x: 0, y: 0, w: 1, h: 4, d: 9}, // left
  {x: 0, y: 0, w: 1, h: 4, d: 9}, // left
  {x: 0, y: 0, w: 2, h: 4, d: 9}, // left
  {x: 3, y: 0, w: 1, h: 4, d: 9}, // right
  {x: 3, y: 0, w: 1, h: 4, d: 9}, // right
  {x: 3, y: 0, w: 1, h: 4, d: 9}, // right
  {x: 2, y: 0, w: 2, h: 4, d: 9}, // right
]

function createInfo(songName, authorName, bpm) {
  return {
    '_version': `${INFO_VERSION}`,
    '_songName': `${songName}`,
    '_songSubName': '',
    '_songAuthorName': `${authorName}`,
    '_levelAuthorName': 'bsjs',
    '_beatsPerMinute': Math.round(bpm),
    '_songTimeOffset': 0,
    '_shuffle': 0,
    '_shufflePeriod': 0,
    '_previewStartTime': PREVIEW_START_TIME,
    '_previewDuration': PREVIEW_DURATION,
    '_songFilename': 'song.egg',
    '_coverImageFilename': 'cover.jpg',
    '_environmentName': jsu.choose(ENVIRONMENTS),
    "_allDirectionsEnvironmentName": "GlassDesertEnvironment", // v2.0.0
    '_environmentNames': [], // v2.1.0
    "_colorSchemes": [], // v2.1.0
    '_customData': {},
    '_difficultyBeatmapSets': [],
  }
}

function createBMPInfo(countSamples, sampleRate, lastBeat) {
  return {
    "_version": BPM_INFO_VERSION,
    "_songSampleCount": countSamples,
    "_songFrequency": sampleRate,
    "_regions": [
      {
        "_startSampleIndex": 0,
        "_endSampleIndex": countSamples,
        "_startBeat": 0,
        "_endBeat": lastBeat,
      }
    ]
  };
}

function addDiff(info, difficulty, offset = 0, characteristicName = "Standard") {
  let _difficulty = "",
      _difficultyRank = 0,
      _beatmapFilename = "",
      _noteJumpMovementSpeed = 0;

  switch(difficulty) {
    case "easy":
      _difficulty = "Easy";
      _difficultyRank = 1;
      _noteJumpMovementSpeed = jsu.choose([8,9,10]);
      break;
    case "normal":
      _difficulty = "Normal";
      _difficultyRank = 3;
      _noteJumpMovementSpeed = jsu.choose([10,11,12]);
      break;
    case "hard":
      _difficulty = "Hard";
      _difficultyRank = 5;
      _noteJumpMovementSpeed = jsu.choose([12,13,14]);
      break;
    case "expert":
      _difficulty = "Expert";
      _difficultyRank = 7;
      _noteJumpMovementSpeed = jsu.choose([14,15,16]);
      break;
    case "expertPlus":
      _difficulty = "ExpertPlus";
      _difficultyRank = 9;
      _noteJumpMovementSpeed = jsu.choose([16,17,18]);
      break;
  }

  _beatmapFilename = `${_difficulty}${characteristicName}.dat`;

  let _difficultyBeatmap = {
    _difficulty: _difficulty,
    _difficultyRank: _difficultyRank,
    _beatmapFilename: _beatmapFilename,
    _noteJumpMovementSpeed: _noteJumpMovementSpeed,
    _noteJumpStartBeatOffset: offset,
    _beatmapColorSchemeIdx: 0,
    _environmentNameIdx: 0,
    _customData: {},
  }

  let _difficultyBeatmapSets = info._difficultyBeatmapSets.find(function(item) {
    return item._beatmapCharacteristicName == characteristicName;
  });

  if (!_difficultyBeatmapSets) {
    _difficultyBeatmapSets = {
      _beatmapCharacteristicName: characteristicName,
      _difficultyBeatmaps: [],
    }

    info._difficultyBeatmapSets.push(_difficultyBeatmapSets);
  }

  _difficultyBeatmapSets._difficultyBeatmaps.push(_difficultyBeatmap);
  
  return _difficultyBeatmap;
}

function createLevel() {
  return {
    'version': `${MAP_VERSION}`,

    // notes
    'colorNotes': [],
    'bombNotes': [],
    'obstacles': [],
    'sliders': [],
    'burstSliders': [], // v4: chains

    // events
    'basicBeatmapEvents': [],
    'colorBoostBeatmapEvents': [],

    'waypoints': [],
    'lightColorEventBoxGroups': [],
    'lightRotationEventBoxGroups': [],
    'lightTranslationEventBoxGroups': [],
    'bpmEvents': [],
    'rotationEvents': [],
    'basicEventTypesWithKeywords': {
      'd': [],
    },
    'useNormalEventsAsCompatibleEvents': true,
    'customData': {},
  }
}

function getPotisionIndex(note) {
  return NOTE_POSITIONS.findIndex(function(item) {
    return item.x === note.x && item.y === note.y;
  });
}

function getDirectionIndex(note) {
  return NOTE_DIRECTIONS.findIndex(function(item) {
    return item.d === note.d;
  });
}

// only support vertical obstacle
function getObstaclePositionIndexes(o) {
  let positions = [];
  for (let i = 0; i < o.w; i++) {
    for (let j = 2; j >= 0; j--) {
      const p = getPotisionIndex({ x: o.x + i, y: j });
      positions.push(p);
    }
  }
  return positions;
}

function chkDupeNotes(l, r) {
  if (!l || !r) {
    return false;
  }
  const lp = getPotisionIndex(l);
  const ld = getDirectionIndex(l);
  const rp = getPotisionIndex(r);
  const rd = getDirectionIndex(r);
  if (lp === -1) {
    throw new Error(`Position not found: ${JSON.stringify(l)}`);
  }
  if (ld === -1) {
    throw new Error(`Direction not found: ${JSON.stringify(l)}`);
  }
  if (rp === -1) {
    throw new Error(`Position not found: ${JSON.stringify(r)}`);
  }
  if (rd === -1) {
    throw new Error(`Direction not found: ${JSON.stringify(r)}`);
  }
  // same position
  if (lp === rp) {
    return true;
  }
  // crossed, cross position
  if (getCol(lp) > getCol(rp)) {
    // same row
    if (isSameRow(lp, rp)) {
      return true;
    }
    // any row
    if (Math.random() < 1 - CROSS_POSITION_RATE) {
      return true;
    }
  }
  // same row, any space
  if (isSameRow(lp, rp)) {
    if (ld === 3 || ld === 5) {
      return true;
    }
    if (rd === 3 || rd === 5) {
      return true;
    }
  }
  // same row, no space
  if (isSameRow(lp, rp) && getColDiff(lp, rp) === 1) {
    if (lp < rp) {
      // l: left, r: right
      if (ld !== rd) {
        if (ld === 0 || ld === 2 || ld === 6 || ld === 8) {
          return true;
        }
        if (rd === 0 || rd === 2 || rd === 6 || rd === 8) {
          return true;
        }
      }
    } else if (lp > rp) {
      // l: right, r: left
      if (ld !== rd) {
        if (ld === 0 || ld === 2 || ld === 6 || ld === 8) {
          return true;
        }
        if (rd === 0 || rd === 2 || rd === 6 || rd === 8) {
          return true;
        }
      }
    }
  }
  // same col, any space
  if (isSameCol(lp, rp)) {
    if (ld === 1 || ld === 7) {
      return true;
    }
    if (rd === 1 || rd === 7) {
      return true;
    }
  }
  // same col, no space
  if (isSameCol(lp, rp) && getRowDiff(lp, rp) === 1) {
    if (lp < rp) {
      // l: top, r: bottom
      if (ld !== rd) {
        if (ld === 0 || ld === 2 || ld === 6 || ld === 8) {
          return true;
        }
        if (rd === 0 || rd === 2 || rd === 6 || rd === 8) {
          return true;
        }
      }
    } else if (lp > rp) {
      // l: bottom, r: top
      if (ld !== rd) {
        if (ld === 0 || ld === 2 || ld === 6 || ld === 8) {
          return true;
        }
        if (rd === 0 || rd === 2 || rd === 6 || rd === 8) {
          return true;
        }
      }
    }
  }
  // diagonal, no space
  if (isDiagonalPosition(lp, rp)) {
    const lc = getCol(lp);
    const lr = getRow(lp);
    const rc = getCol(rp);
    const rr = getRow(rp);
    if (lc < rc && lr < rr) {
      // l,-
      // -,r
      if (ld === 0 || ld === 8) {
        return true;
      }
      if (rd === 0 || rd === 8) {
        return true;
      }
    } else if (lc > rc && lr > rr) {
      // r,-
      // -,l
      if (ld === 0 || ld === 8) {
        return true;
      }
      if (rd === 0 || rd === 8) {
        return true;
      }
    } else if (lc > rc && lr < rr) {
      // -,l
      // r,-
      if (ld === 2 || ld === 6) {
        return true;
      }
      if (rd === 2 || rd === 6) {
        return true;
      }
    } else if (lc < rc && lr > rr) {
      // -,r
      // l,-
      if (ld === 2 || ld === 6) {
        return true;
      }
      if (rd === 2 || rd === 6) {
        return true;
      }
    }
  }
  return false;
}

function chkSamePosition(a, b) {
  if (!a || !b) {
    return false;
  }
  const ap = getPotisionIndex(a);
  const bp = getPotisionIndex(b);
  if (ap === -1) {
    throw new Error(`Position not found: ${JSON.stringify(a)}`);
  }
  if (bp === -1) {
    throw new Error(`Position not found: ${JSON.stringify(b)}`);
  }
  return ap === bp;
}

function chkOverlappedObstacle(o, n) {
  if (!o || !n) {
    return false;
  }
  const op = getObstaclePositionIndexes(o);
  const np = getPotisionIndex(n);
  if (op.length < 1) {
    throw new Error("Position not found.");
  }
  if (np === -1) {
    throw new Error("Position not found.");
  }
  return op.indexOf(np) > -1;
}

// [
//   0,1,2,
//   3,4,5,
//   6,7,8,
// ];
function chkTailNoteDirection(headNote, tailNote) {
  const hd = getDirectionIndex(headNote);
  const td = getDirectionIndex(tailNote);
  return SLIDER_TAIL_DIRECTION_CASES[hd].indexOf(td) > -1;
}

function createNoteByIndex(beat, type, positionIndex, directionIndex) {
  return Object.assign({b: beat, c: type}, NOTE_POSITIONS[positionIndex], NOTE_DIRECTIONS[directionIndex]);
}

function getNextDirectionIndex(d, isSamePosition) {
  return jsu.choose(isSamePosition ? SAME_POSITION_DIRECTION_CASES[d] : NEW_POSITION_DIRECTION_CASES[d]); 
}

function getRow(i) {
  return Math.floor(i / 4);
}

function getCol(i) {
  return i % 4;
}

function isSameRow(a, b) {
  return Math.floor(a / 4) === Math.floor(b / 4);
}

function isSameCol(a, b) {
  return a % 4 === b % 4;
}

function getRowDiff(a, b) {
  return Math.abs(Math.floor(a / 4) - Math.floor(b / 4));
}

function getColDiff(a, b) {
  return Math.abs((a % 4) - (b % 4));
}

function isDiagonalPosition(a, b) {
  return getColDiff(a, b) === 1 && getRowDiff(a, b) === 1;
}

function getPrevLeftNote(colorNotes) {
  for (let i = colorNotes.length - 1; i >= 0; i--) {
    if (colorNotes[i].c == 0) {
      return colorNotes[i];
    }
  }
  return null;
}

function getPrevRightNote(colorNotes) {
  for (let i = colorNotes.length - 1; i >= 0; i--) {
    if (colorNotes[i].c == 1) {
      return colorNotes[i];
    }
  }
  return null;
}

function getPrevObstacle(obstacles) {
  return obstacles[obstacles.length - 1] || null;
}

// [
//   3,2,   1, x,
//   4,50%, 1, x,
//   3,2,   1, x,
// ]
function getNextLeftPositionIndex(lp) {
  let positions = [];

  // left top
  if (isDiagonalPosition(lp, lp-5)) {
    for (let i = 0; i < LEFT_POSITION_COUNT[0]; i++) {
      positions.push(lp-5);
    }
  }
  // top
  if (isSameCol(lp, lp-4)) {
    for (let i = 0; i < LEFT_POSITION_COUNT[1]; i++) {
      positions.push(lp-4);
    }
  }
  // right top
  if (isDiagonalPosition(lp, lp-3)) {
    for (let i = 0; i < LEFT_POSITION_COUNT[2]; i++) {
      positions.push(lp-3);
    }
  }
  // left
  if (isSameRow(lp, lp-1)) {
    for (let i = 0; i < LEFT_POSITION_COUNT[3]; i++) {
      positions.push(lp-1);
    }
  }
  // center
  for (let i = 0; i < LEFT_POSITION_COUNT[4]; i++) {
    positions.push(lp);
  }
  // right
  if (isSameRow(lp, lp+1)) {
    for (let i = 0; i < LEFT_POSITION_COUNT[5]; i++) {
      positions.push(lp+1);
    }
  }
  // left bottom
  if (isDiagonalPosition(lp, lp+3)) {
    for (let i = 0; i < LEFT_POSITION_COUNT[6]; i++) {
      positions.push(lp+3);
    }
  }
  // bottom
  if (isSameCol(lp, lp+4)) {
    for (let i = 0; i < LEFT_POSITION_COUNT[7]; i++) {
      positions.push(lp+4);
    }
  }
  // right bottom
  if (isDiagonalPosition(lp, lp+5)) {
    for (let i = 0; i < LEFT_POSITION_COUNT[8]; i++) {
      positions.push(lp+5);
    }
  }

  positions = positions.filter(function(p) {
    return POSITIONS.indexOf(p) > -1;
  });

  positions = jsu.shuffle(positions);

  if (LESS_CENTER_FACTOR_LIMIT > -1) {
    let max = LESS_CENTER_FACTOR_LIMIT;
    for (let i = positions.length - 1; i >= 0; i--) {
      if (positions[i] === 5) {
        if (max < 1) {
          positions.splice(i, 1);
        } else {
          max--;
        }
      }
    }

    max = LESS_CENTER_FACTOR_LIMIT;
    for (let i = positions.length - 1; i >= 0; i--) {
      if (positions[i] === 6) {
        if (max < 1) {
          positions.splice(i, 1);
        } else {
          max--;
        }
      }
    }
  }

  if (LESS_TOP_POSITION_LIMIT > -1) {
    let max = LESS_TOP_POSITION_LIMIT;
    for (let i = positions.length - 1; i >= 0; i--) {
      if (getRow(positions[i]) === 0) {
        if (max < 1) {
          positions.splice(i, 1);
        } else {
          max--;
        }
      }
    }
  }

  return jsu.choose(positions);
}

function getNextRightPositionIndex(rp) {
  let positions = [];

  // left top
  if (isDiagonalPosition(rp, rp-5)) {
    for (let i = 0; i < RIGHT_POSITION_COUNT[0]; i++) {
      positions.push(rp-5);
    }
  }
  // top
  if (isSameCol(rp, rp-4)) {
    for (let i = 0; i < RIGHT_POSITION_COUNT[1]; i++) {
      positions.push(rp-4);
    }
  }
  // right top
  if (isDiagonalPosition(rp, rp-3)) {
    for (let i = 0; i < RIGHT_POSITION_COUNT[2]; i++) {
      positions.push(rp-3);
    }
  }
  // left
  if (isSameRow(rp, rp-1)) {
    for (let i = 0; i < RIGHT_POSITION_COUNT[3]; i++) {
      positions.push(rp-1);
    }
  }
  // center
  for (let i = 0; i < RIGHT_POSITION_COUNT[4]; i++) {
    positions.push(rp);
  }
  // right
  if (isSameRow(rp, rp+1)) {
    for (let i = 0; i < RIGHT_POSITION_COUNT[5]; i++) {
      positions.push(rp+1);
    }
  }
  // left bottom
  if (isDiagonalPosition(rp, rp+3)) {
    for (let i = 0; i < RIGHT_POSITION_COUNT[6]; i++) {
      positions.push(rp+3);
    }
  }
  // bottom
  if (isSameCol(rp, rp+4)) {
    for (let i = 0; i < RIGHT_POSITION_COUNT[7]; i++) {
      positions.push(rp+4);
    }
  }
  // right bottom
  if (isDiagonalPosition(rp, rp+5)) {
    for (let i = 0; i < RIGHT_POSITION_COUNT[8]; i++) {
      positions.push(rp+5);
    }
  }

  positions = positions.filter(function(p) {
    return POSITIONS.indexOf(p) > -1;
  });

  positions = jsu.shuffle(positions);

  if (LESS_CENTER_FACTOR_LIMIT > -1) {
    let max = LESS_CENTER_FACTOR_LIMIT;
    for (let i = positions.length - 1; i >= 0; i--) {
      if (positions[i] === 5) {
        if (max < 1) {
          positions.splice(i, 1);
        } else {
          max--;
        }
      }
    }

    max = LESS_CENTER_FACTOR_LIMIT;
    for (let i = positions.length - 1; i >= 0; i--) {
      if (positions[i] === 6) {
        if (max < 1) {
          positions.splice(i, 1);
        } else {
          max--;
        }
      }
    }
  }

  if (LESS_TOP_POSITION_LIMIT > -1) {
    let max = LESS_TOP_POSITION_LIMIT;
    for (let i = positions.length - 1; i >= 0; i--) {
      if (getRow(positions[i]) === 0) {
        if (max < 1) {
          positions.splice(i, 1);
        } else {
          max--;
        }
      }
    }
  }

  return jsu.choose(positions);
}

function createNextLeftNote(beat, prevLeftNote, currRightNote) {
  let positionIndex, directionIndex;
  if (!prevLeftNote) {
    [positionIndex, directionIndex] = jsu.choose(LEFT_NOTE_FORMATS);
    if (currRightNote) {
      directionIndex = jsu.choose(NEW_DIRECTION_CASES[getDirectionIndex(currRightNote)]);
    }
  } else {
    const prevPositionIndex = getPotisionIndex(prevLeftNote);
    positionIndex = getNextLeftPositionIndex(prevPositionIndex);
    directionIndex = getNextDirectionIndex(getDirectionIndex(prevLeftNote), positionIndex === prevPositionIndex);
  }
  return createNoteByIndex(beat, 0, positionIndex, directionIndex);
}

function createNextRightNote(beat, prevRightNote, currLeftNote) {
  let positionIndex, directionIndex;
  if (!prevRightNote) {
    [positionIndex, directionIndex] = jsu.choose(RIGHT_NOTE_FORMATS);
    if (currLeftNote) {
      directionIndex = jsu.choose(NEW_DIRECTION_CASES[getDirectionIndex(currLeftNote)]);
    }
  } else {
    const prevPositionIndex = getPotisionIndex(prevRightNote);
    positionIndex = getNextRightPositionIndex(prevPositionIndex);
    directionIndex = getNextDirectionIndex(getDirectionIndex(prevRightNote), positionIndex === prevPositionIndex);
  }
  return createNoteByIndex(beat, 1, positionIndex, directionIndex);
}

function createVerticalObstacle(beat) {
  return Object.assign({b: beat}, jsu.choose(OBSTACLE_FORMATS));
}

function createSliderNote(headNote, tailNote) {
  return {
    "c": headNote.c, // Color
    "b": headNote.b, // Head Beat
    "x": headNote.x, // Head Line Index
    "y": headNote.y, // Head Line Layer
    "d": headNote.d, // Head Cut Direction
    "mu": 1.0, // Head Control Point Length Multiplier
    "tb": tailNote.b, // Tail Beat
    "tx": tailNote.x, // Tail Line Index
    "ty": tailNote.y, // Tail Line Layer
    "tc": tailNote.d, // Tail Cut Direction
    "tmu": 1.0, // Tail Control Point Length Multiplier
    "m": 0, // Mid-Anchor Mode
  };
}

// const types = [
//   0,1,2,3,4, // light
//   5, // color boost legacy (deprecated)
//   6,7, // light
//   8,9, // value trigger
//   10, // light / bpm change legacy
//   11, // light
//   12,13, // value
//   14,15, // lane rotation legacy (deprecated)
//   16,17,18,19, // value
//   40,41,42,43, // special
//   100, // bpm change  (deprecated)
// ];

// const lightTypes = [0,1,2,3,4,6,7,8,9,11];
// const valueTypes = [8,9,12,13,16,17,18,19];
// const testTypes = [
//   0,1,2,3,4,6,7,8,9,11,
//   8,9,12,13,16,17,18,19,
// ];

// const values = [
//   0, // off
//   1,2,3,4, // secondary
//   5,6,7,8, // primary
//   9,10,11,12, // white
// ];

// // static, flash, fade, transition
// const secondaryValues = [
//   1,2,3,4,
// ];

// const primaryValues = [
//   5,6,7,8,
// ];

// const wihteValues = [
//   9,10,11,12
// ];

// https://bsmg.wiki/mapping/map-format/lightshow.html#index-filters
function createBackgroundEvent(beat) {
  const types = [0,1,2,3,4,6,7,8,9,11];
  const values = [0,0,1,2,3,4,5,6,7,8];
  return {
    "b": beat, // Beat
    "et": jsu.choose(types), // Type
    "i": jsu.choose(values), // Value
    "f": 1,// Float Value
  };
}

// https://bsmg.wiki/mapping/map-format/lightshow.html#index-filters
function createCutEvent(beat) {
  const types = [8,9,12,13,16,17,18,19];
  const values = [0,0,1,2,3,4,5,6,7,8];
  return {
    "b": beat, // Beat
    "et": jsu.choose(types), // Type
    "i": jsu.choose(values), // Value
    "f": 1, // Float Value
  };
}

// https://bsmg.wiki/mapping/map-format/beatmap.html
// 4 x 3 blocks
// position
// const cols = [0,1,2,3];
// 0  left most
// 1  left
// 2  right
// 3  right most

// const rows = [0,1,2];
// 0  bottom
// 1  center
// 2  top

// const types = [0, 1];
// 0	Left Saber
// 1	Right Saber

// const directions = [0,1,2,3,4,5,6,7,8];
// 0	Up
// 1	Down
// 2	Left
// 3	Right
// 4	Up Left
// 5	Up Right
// 6	Down Left
// 7	Down Right
// 8	Any

// const angles = [0];
// 0 to 360
function createDummyNote(beat) {
  const cols = [0,1,2,3];
  const rows = [0,1,2];
  const types = [0,1]; // left, right
  const directions = [0,1,2,3,4,5,6,7,8];
  const angles = [0];
  return {
    'b': beat,
    'x': jsu.choose(cols),
    'y': jsu.choose(rows),
    'c': jsu.choose(types),
    'd': jsu.choose(directions),
    'a': jsu.choose(angles),
  }
}

// https://bsmg.wiki/mapping/map-format/beatmap.html#bomb-notes
function createBombNote(beat, options) {
  if (!options) {
    options = {};
  }

  // 4 x 3 blocks
  // position
  const cols = options.cols || [0,1,2,3];
  // 0  left most
  // 1  left
  // 2  right
  // 3  right most

  const rows = options.rows || [0,1,2];
  // 0  bottom
  // 1  center
  // 2  top

  return {
    'b': beat,
    'x': jsu.choose(cols),
    'y': jsu.choose(rows),
  }
}

// https://bsmg.wiki/mapping/map-format/beatmap.html#obstacles
function createObstacle(beat, options) {
  if (!options) {
    options = {};
  }

  // 4 x 3 blocks
  // position
  const cols = options.cols || [0,1,2,3];
  // 0  left most
  // 1  left
  // 2  right
  // 3  right most

  const rows = options.rows || [0,1,2];
  // 0  bottom
  // 1  center
  // 2  top

  const duration = options.duration || [3,3,3,3,3,5,5,5,5,7,7,7,9,9,11];

  const widthList = [1,2,3];
  const heightList = [1,2,3,4,5];

  return {
    'b': beat,
    "d": jsu.choose(duration), // Duration
    'x': jsu.choose(cols),
    'y': jsu.choose(rows),
    "w": 1, // Width
    "h": 5, // Height
  }
}

function getMetadata(srcPath) {
  return new Promise(function(resolve, reject) {
    ffmpeg.ffprobe(srcPath, function(err, metadata) {
      if (err) {
        reject(err);
        return;
      }
      resolve(metadata);
    });
  });
}

function getCover(filePath) {
  return new Promise(function(resolve, reject) {
    jsmediatags.read(filePath, {
      onSuccess: function(tag) {
        let tags = tag.tags;
        let image = tags.picture;
        if (!image) {
          reject(new Error("Cover not found."));
          return;
        }
        resolve(image);
      },
      onError: function(err) {
        reject(err);
      }
    });
  });
}

function toWav(srcPath) {
  return new Promise(function(resolve, reject) {
    if (!fs.existsSync(TMP_PATH)) {
      fs.mkdirSync(TMP_PATH);
    }

    const dstPath = path.join(TMP_PATH, `${path.basename(srcPath, path.extname(srcPath))}.wav`);

    // remove old file
    if (fs.existsSync(dstPath)) {
      fs.unlinkSync(dstPath);
    }

    // convert mp3 to wav
    ffmpeg(srcPath)
      .output(dstPath)
      .on('error', function(err) {
        reject(err);
      })
      .on('end', function(stdout, stderr) {
        resolve(dstPath);
      })
      .run();
  });
}

function toOgg(srcPath) {
  return new Promise(function(resolve, reject) {
    // ffmpeg -i input.wav -c:a libvorbis -qscale:a 10 output.ogg
    const dstPath = path.join(TMP_PATH, `${path.basename(srcPath, path.extname(srcPath))}.ogg`);

    ffmpeg(srcPath)
      .audioCodec('libvorbis')
      // .audioBitrate('320k') // fix
      .audioBitrate(192) // fix
      .audioQuality(7)
      .output(dstPath)
      .on('error', function(err) {
        reject(err);
      })
      .on('end', function(stdout, stderr) {
        resolve(dstPath);
      })
      .run();
  });
}

function getSamples(channels) {
  let samples = new Float32Array(channels[0].length).fill(0);
  for (let i = 0; i < channels.length; i++) {
    for (let j = 0; j < channels[i].length; j++) {
      samples[j] += channels[i][j];
    }
  }
  return samples;
}

function getEnerge(samples) {
  return samples.reduce((prev, curr) => prev + curr * curr) / samples.length;
}

function getEnergies(samples, chunkSize = 1024) {
  let energies = [];
  for (let i = 0; i < samples.length; i += chunkSize) {
    const energe = getEnerge(samples.slice(i, i + chunkSize));
    energies.push(energe);
  }
  return energies;
}

async function generate(srcPath) {
  let songName = path.basename(srcPath, path.extname(srcPath));
  let authorName = "Unknown";
  const metadata = await getMetadata(srcPath);
  if (metadata && metadata.format && metadata.format.tags) {
    const tags = metadata.format.tags;
    if (tags.title) {
      songName = tags.title;
    }
    if (tags.artist) {
      authorName = tags.artist;
    }
  }

  const wavPath = await toWav(srcPath);
  const wavBuffer = fs.readFileSync(wavPath);

  // check output directory
  if (!fs.existsSync(OUTPUT_PATH)) {
    fs.mkdirSync(OUTPUT_PATH);
  }

  const { channelData, sampleRate, duration } = wav.decode(wavBuffer);
  const { tempo } = wav.analyze(channelData, sampleRate, sampleRate * 0.5);
  const samples = getSamples(channelData);
  const energies = getEnergies(samples);
  const avgEnerge = energies.reduce(function(prev, curr) {
    return prev + curr;
  }, 0) / energies.length;

  const info = createInfo(songName, authorName, tempo);
  const characteristicNames = ["Standard", "Standard", "Standard", "Standard", "Standard"];
  const difficulties = ["easy", "normal", "hard", "expert", "expertPlus"];
  let dirName = `${songName.replace(/[/\\?%*:|"<>]/g, '_')}`;
  let dirIndex = 0;
  let dirPath = path.join(OUTPUT_PATH, dirName);
  while(fs.existsSync(dirPath)) {
    dirIndex += 1;
    dirName = `${songName.replace(/[/\\?%*:|"<>]/g, '_')} (${dirIndex})`;
    dirPath = path.join(OUTPUT_PATH, dirName);
  }

  // create directory
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath);
  }
  
  let lastBeat = 0;
  for (let i = 0; i < difficulties.length; i++) {
    const difficulty = difficulties[i];
    const characteristicName = characteristicNames[i];
    const noteJumpOffset = 0;
    const level = createLevel();
    const {colorNotes, bombNotes, obstacles, sliders, burstSliders, basicBeatmapEvents} = level;
    let {
      bufferSize,
      minVolume,
      energeThreshold,
      noteSpawnRates,
      bombSpawnRate,
      obstacleSpawnRate,
      sliderSpawnRate,
      beatSpacing,
      noteSpacing,
      sliderRange,
      noteConnectSpacing,
      obstacleSpacing,
      obstacleDisappearSpacing,
      bombDisappearSpacing,
    } = DIFFICULTY_OPTIONS[difficulty];

    let { beats } = wav.analyze(channelData, sampleRate, Math.round(sampleRate * bufferSize));
    let convertedBeats = [];
    for (const beat of beats) {
      // remove low volume
      if (beat.value < minVolume) {
        continue;
      }
      // convert beat time
      let time = beat.time * (tempo / 60);

      // convert beat for editor => 1/4
      if (ENABLE_BEAT_SPACING) {
        time = Math.round(time / beatSpacing) * beatSpacing;
      }

      if (time < START_OFFSET) {
        continue;
      }

      // find same beat
      let convertedBeat = convertedBeats.find(function(item) {
        return item.beat === time;
      });

      if (!convertedBeat) {
        // get energe
        const chunkSize = 1024;
        const hopSize = chunkSize * 0.5;
        const chunk = samples.slice(Math.max(0, beat.index - hopSize), Math.min(samples.length, beat.index + hopSize));
        const energe = getEnerge(chunk);

        convertedBeats.push({
          beat: time,
          energe: energe,
        });

        if (lastBeat < time) {
          lastBeat = time;
        }
      }
    }

    // create notes
    let backgroundOffset = 0;
    let countLeftConnectedNotes = 0;
    let countRightConnectedNotes = 0;
    let countLeftNotes = 0;
    let countRightNotes = 0;
    let countLargeEnergies = 0;
    let countPassedNotes = 0;
    let countPositions = [
      0,0,0,0,
      0,0,0,0,
      0,0,0,0,
    ];
    let countDirections = [
      0,0,0,
      0,0,0,
      0,0,0,
    ];
    for (let j = 0; j < convertedBeats.length; j++) {
      let { beat, energe } = convertedBeats[j];
      let prevObstacle = getPrevObstacle(obstacles);
      let prevLeftNote = getPrevLeftNote(colorNotes);
      let prevRightNote = getPrevRightNote(colorNotes);
      let isObstacleExists = prevObstacle && prevObstacle.b <= beat && beat <= (prevObstacle.b + prevObstacle.d) + obstacleDisappearSpacing; // add spacing 0.25 beat
      let isLeftConnected = prevLeftNote && beat <= prevLeftNote.b + noteConnectSpacing;
      let isRightConnected = prevRightNote && beat <= prevRightNote.b + noteConnectSpacing;
      let isLeftNoteCreatable = !prevLeftNote || beat >= prevLeftNote.b + noteSpacing;
      let isRightNoteCreatable = !prevRightNote || beat >= prevRightNote.b + noteSpacing;
      let isLeftFirst = Math.random() < 0.5;
      let isLargeEnerge = energe >= avgEnerge * energeThreshold;
      let createObstacle = Math.random() < obstacleSpawnRate && (!prevObstacle || beat >= (prevObstacle.b + prevObstacle.d) + obstacleSpacing);
      let createLeftNote = false;
      let createRightNote = false;
      let currObstacle = isObstacleExists ? prevObstacle : null;
      let isCutEventAdded = false;
      let currLeftNote;
      let currRightNote;
      let countDupe = 0;

      // count large energe beat
      if (isLargeEnerge) {
        countLargeEnergies += 1;
      }

      // check prev left note
      if (isLeftConnected && isLeftNoteCreatable) {
        if (!prevRightNote || prevLeftNote.b > prevRightNote.b) {
          isLeftFirst = true;
          createLeftNote = true;
        }
      }

      // check prev right note
      if (isRightConnected && isRightNoteCreatable) {
        if (!prevLeftNote || prevLeftNote.b < prevRightNote.b) {
          isLeftFirst = false;
          createRightNote = true;
        }
      }

      // random create
      if (isLeftFirst) {
        if (isLeftNoteCreatable && !createLeftNote) {
          createLeftNote = Math.random() < noteSpawnRates[0] + (isLargeEnerge ? 0.25 : 0);
        }
        if (isRightNoteCreatable && !createRightNote) {
          createRightNote = Math.random() < noteSpawnRates[1] + (isLargeEnerge ? 0.125 : 0);
        }
      } else {
        if (isRightNoteCreatable && !createRightNote) {
          createRightNote = Math.random() < noteSpawnRates[0] + (isLargeEnerge ? 0.25 : 0);
        }
        if (isLeftNoteCreatable && !createLeftNote) {
          createLeftNote = Math.random() < noteSpawnRates[1] + (isLargeEnerge ? 0.125 : 0);
        }
      }

      if (createObstacle) {
        currObstacle = createVerticalObstacle(beat);
        obstacles.push(currObstacle);
      }

      if (isLeftFirst) {
        // create left note
        if (createLeftNote) {
          currLeftNote = createNextLeftNote(beat, isLeftConnected ? prevLeftNote : null);
          countDupe = 0;
          while(
            chkOverlappedObstacle(currObstacle, currLeftNote) || 
            chkSamePosition(prevRightNote, currLeftNote)
          ) {
            currLeftNote = createNextLeftNote(beat, isLeftConnected ? prevLeftNote : null);
            countDupe += 1;
            if (countDupe > 390) {
              currLeftNote = null;
              countPassedNotes += 1;
              break;
            }
          }
        }
        // create right note
        if (createRightNote) {
          currRightNote = createNextRightNote(beat, isRightConnected ? prevRightNote : null, currLeftNote);
          countDupe = 0;
          while(
            chkOverlappedObstacle(currObstacle, currRightNote) || 
            chkSamePosition(prevLeftNote, currRightNote) || 
            chkDupeNotes(currLeftNote, currRightNote)
          ) {
            currRightNote = createNextRightNote(beat, isRightConnected ? prevRightNote : null, currLeftNote);
            countDupe += 1;
            if (countDupe > 390) {
              currRightNote = null;
              countPassedNotes += 1;
              break;
            }
          }
        }
      } else {
        // create right note
        if (createRightNote) {
          currRightNote = createNextRightNote(beat, isRightConnected ? prevRightNote : null);
          countDupe = 0;
          while(
            chkOverlappedObstacle(currObstacle, currRightNote) || 
            chkSamePosition(prevLeftNote, currRightNote)
          ) {
            currRightNote = createNextRightNote(beat, isRightConnected ? prevRightNote : null);
            countDupe += 1;
            if (countDupe > 390) {
              currRightNote = null;
              countPassedNotes += 1;
              break;
            }
          }
        }
        // create left note
        if (createLeftNote) {
          currLeftNote = createNextLeftNote(beat, isLeftConnected ? prevLeftNote : null, currRightNote);
          countDupe = 0;
          while(
            chkOverlappedObstacle(currObstacle, currLeftNote) || 
            chkSamePosition(prevRightNote, currLeftNote) || 
            chkDupeNotes(currLeftNote, currRightNote)
          ) {
            currLeftNote = createNextLeftNote(beat, isLeftConnected ? prevLeftNote : null, currRightNote);
            countDupe += 1;
            if (countDupe > 390) {
              currLeftNote = null;
              countPassedNotes += 1;
              break;
            }
          }
        }
      }

      // count left note
      if (currLeftNote) {
        countLeftNotes += 1;
        countLeftConnectedNotes += isLeftConnected ? 1 : 0;
        countPositions[getPotisionIndex(currLeftNote)] += 1;
        countDirections[getDirectionIndex(currLeftNote)] += 1;

        // add light event
        if (!isCutEventAdded) {
          basicBeatmapEvents.push(createCutEvent(beat));
          isCutEventAdded = true;
        }
      }
      
      // count right note
      if (currRightNote) {
        countRightNotes += 1;
        countRightConnectedNotes += isRightConnected ? 1 : 0;
        countPositions[getPotisionIndex(currRightNote)] += 1;
        countDirections[getDirectionIndex(currRightNote)] += 1;

        // add light event
        if (!isCutEventAdded) {
          basicBeatmapEvents.push(createCutEvent(beat));
          isCutEventAdded = true;
        }
      }

      // add note to array
      if (isLeftFirst) {
        if (currLeftNote) {
          colorNotes.push(currLeftNote);
        }
        if (currRightNote) {
          colorNotes.push(currRightNote);
        }
      } else {
        if (currRightNote) {
          colorNotes.push(currRightNote);
        }
        if (currLeftNote) {
          colorNotes.push(currLeftNote);
        }
      }

      // add background lighting
      if (beat >= backgroundOffset + BACKGROUND_SPACING && Math.random() < 0.5) {
        backgroundOffset = beat;
        basicBeatmapEvents.push(createBackgroundEvent(beat));
      }
    }

    // create left slider
    for (let i = 0; i < colorNotes.length; i++) {
      if (colorNotes[i].c !== 0) {
        continue;
      }

      let a = colorNotes[i];
      let b;
      for (let j = i + 1; j < colorNotes.length; j++) {
        if (colorNotes[j].c === 0) {
          if (chkTailNoteDirection(a, colorNotes[j])) {
            b = colorNotes[j];
          }
          break;
        }
      }

      if (!b) {
        continue;
      }

      const beatDiff = b.b - a.b;
      if (beatDiff >= sliderRange[0] && beatDiff <= sliderRange[1]) {
        if (Math.random() < sliderSpawnRate) {
          const slider = createSliderNote(a, b);
          sliders.push(slider);
        }
      }
    }

    // create right slider
    for (let i = 0; i < colorNotes.length; i++) {
      if (colorNotes[i].c !== 1) {
        continue;
      }

      let a = colorNotes[i];
      let b;
      for (let j = i + 1; j < colorNotes.length; j++) {
        if (colorNotes[j].c === 1) {
          if (chkTailNoteDirection(a, colorNotes[j])) {
            b = colorNotes[j];
          }
          break;
        }
      }

      if (!b) {
        continue;
      }

      const beatDiff = b.b - a.b;
      if (beatDiff >= sliderRange[0] && beatDiff <= sliderRange[1]) {
        if (Math.random() < sliderSpawnRate) {
          const slider = createSliderNote(a, b);
          sliders.push(slider);
        }
      }
    }

    // sort sliders
    sliders.sort(function(a, b) {
      return a.b - b.b;
    });

    // count crossed notes
    let countCrossedNotes = 0;
    for (let k = 0; k < colorNotes.length; k++) {
      let a = colorNotes[k];
      let b = colorNotes[k + 1];
      if (!b || a.b !== b.b || a.c === b.c) {
        continue;
      }
      const ac = getCol(getPotisionIndex(a));
      const bc = getCol(getPotisionIndex(b));
      if (a.c === 0) {
        // left: a, right: b
        if (ac > bc) {
          countCrossedNotes++;
        }
      } else {
        // left: b, right: a
        if (bc > ac) {
          countCrossedNotes++;
        }
      }
    }

    // debug
    console.log(`> ${songName}, ${Math.floor(duration)} s, ${tempo} bpm, ${characteristicName}, ${difficulty}.`);
    console.log(`> Total ${colorNotes.length} notes, ${countLargeEnergies} large energe notes`);
    console.log(`> ${countLeftNotes} left notes, ${countLeftConnectedNotes} connected.`);
    console.log(`> ${countRightNotes} right notes, ${countRightConnectedNotes} connected.`);
    console.log(`> ${bombNotes.length} bombs.`);
    console.log(`> ${obstacles.length} obstacles.`);
    console.log(`> ${sliders.length} sliders.`);
    console.log(`> ${burstSliders.length} burst sliders.`);
    console.log(`> ${basicBeatmapEvents.length} beatmap events.`);
    console.log(`> ${countPassedNotes} notes passed. (invalid position, invalid direction)`);
    console.log(`> ${countCrossedNotes} notes crossed. (reverse position left-right notes)`);
    console.log(``);

    // debug details
    console.log(`> note positions`);
    console.log(`  ${String(countPositions[0]).padStart(4, " ")} ${String(countPositions[1]).padStart(4, " ")} ${String(countPositions[2]).padStart(4, " ")} ${String(countPositions[3]).padStart(4, " ")}`);
    console.log(`  ${String(countPositions[4]).padStart(4, " ")} ${String(countPositions[5]).padStart(4, " ")} ${String(countPositions[6]).padStart(4, " ")} ${String(countPositions[7]).padStart(4, " ")}`);
    console.log(`  ${String(countPositions[8]).padStart(4, " ")} ${String(countPositions[9]).padStart(4, " ")} ${String(countPositions[10]).padStart(4, " ")} ${String(countPositions[11]).padStart(4, " ")}`);
    console.log(``);

    console.log(`> note directions`);
    console.log(`  ${String(countDirections[0]).padStart(4, " ")} ${String(countDirections[1]).padStart(4, " ")} ${String(countDirections[2]).padStart(4, " ")}`);
    console.log(`  ${String(countDirections[3]).padStart(4, " ")} ${String(countDirections[4]).padStart(4, " ")} ${String(countDirections[5]).padStart(4, " ")}`);
    console.log(`  ${String(countDirections[6]).padStart(4, " ")} ${String(countDirections[7]).padStart(4, " ")} ${String(countDirections[8]).padStart(4, " ")}`);
    console.log(``);

    // add diff to info
    const diff = addDiff(info, difficulty, noteJumpOffset, characteristicName);
    const filename = diff._beatmapFilename;

    // save level.dat
    fs.writeFileSync(path.join(dirPath, filename), JSON.stringify(level), { encoding: "utf8" });
  }

  // copy cover.jpg
  try {
    const { data, format } = await getCover(srcPath);
    const buffer = Buffer.from(data);
    let coverName;
    if (format === "image/jpeg" || format === "image/jpg") {
      coverName = "cover.jpg";
    } else if (format === "image/png") {
      coverName = "cover.png";
    } else {
      throw new Error("Cover type not supported.");
    }
    fs.writeFileSync(path.join(dirPath, coverName), buffer, { encoding: "utf8" });
    info._coverImageFilename = coverName;
  } catch(err) {
    // console.error(err);
    fs.copyFileSync(COVER_PATH, path.join(dirPath, "cover.jpg"));
    info._coverImageFilename = "cover.jpg";
  }

  // save info.dat
  fs.writeFileSync(path.join(dirPath, "info.dat"), JSON.stringify(info, null, 2), { encoding: "utf8" });

  // save BPMInfo.dat
  const bpmInfo = createBMPInfo(samples.length, sampleRate, lastBeat);
  fs.writeFileSync(path.join(dirPath, "BPMInfo.dat"), JSON.stringify(bpmInfo, null, 2), { encoding: "utf8" });

  // create song.egg
  const oggPath = await toOgg(wavPath);
  fs.renameSync(oggPath, path.join(dirPath, "song.egg"));

  // remove wav
  if (fs.existsSync(wavPath)) {
    fs.unlinkSync(wavPath);
  }
}

// esm
export default {
  setFfmpegPath: ffmpeg.setFfmpegPath,
  setFfprobePath: ffmpeg.setFfprobePath,
  generate: generate,
}