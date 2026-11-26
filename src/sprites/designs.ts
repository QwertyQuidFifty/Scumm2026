/**
 * Character designs: part grids, limb sizes and palettes for the player and
 * each NPC type. See compositor.ts for how they are assembled.
 *
 * Grid legend: '.' transparent, 'K' outline/dark detail. Other keys are
 * per-design palette entries; ramps run highlight -> base -> shade.
 * Boots always use the B/b ramp (the far boot is drawn in b).
 */
import type { ArmStyle, CharacterDesign } from "./compositor.ts";

// ---------------------------------------------------------------------------
// Player: orange hair, brown leather coat with neon trim
// ---------------------------------------------------------------------------

const PLAYER_SLEEVE: ArmStyle = { base: "J", shade: "j", hand: ["SS", "ss"] };

export const PLAYER_DESIGN: CharacterDesign = {
  palette: {
    K: 0x1a1020, // outline / eyes / belt
    L: 0xffb067, // hair highlight
    H: 0xe8692e, // hair
    h: 0xa53d22, // hair shade
    S: 0xf5c6a0, // skin
    s: 0xd08f6c, // skin shade
    r: 0x9c4a3c, // mouth
    G: 0xc08a55, // coat highlight
    J: 0x7a4b2c, // coat
    j: 0x4e2e1d, // coat shade
    N: 0x45e6e6, // neon trim
    T: 0xe04e8a, // shirt
    t: 0x9e2f62, // shirt shade
    Y: 0xf2c84b, // belt buckle
    P: 0x3f3a58, // trousers
    p: 0x29243d, // trousers shade
    B: 0x6a5f78, // boots
    b: 0x3e3648, // boots shade / sole
  },
  head: {
    y: 4,
    sideX: 9,
    front: [
      "...LLHHHH...",
      ".LLHHHHHHHh.",
      "LHHHHHHHHHhh",
      "HHHHHHHHHhhh",
      "HHhSSHSSSShh",
      "HhSSSSSSSSSh",
      ".SSKSSSSKSs.",
      ".SSKSSSSKSs.",
      ".sSSSSsSSSs.",
      "..SSSrrSSs..",
      "...sSSSSs...",
      "....ssss....",
      "....ssss....",
    ],
    back: [
      "...LLHHHH...",
      ".LLLHHHHHHh.",
      "LLHHHHHHHHhh",
      "LHHHHHHHHhhh",
      "HHHHHHHHHhhh",
      "HHHHHHHHhhhh",
      "sHHHHHHHHhhs",
      "sHHHHHHHhhhs",
      ".hHHHHHHhhh.",
      "..hhHHHhhh..",
      "...hhhhhh...",
      "....ssss....",
      "....ssss....",
    ],
    side: [
      "..LLHHHH....",
      ".LHHHHHHHH..",
      "LHHHHHHHHHh.",
      "HHHHhHHHHHhh",
      "HHHhHHHhSSHh",
      "HhHHHHSSSSSs",
      "hHHsSSSSKSS.",
      "hHHssSSSKSSS",
      ".hHsSSSSSSs.",
      ".hhSSSSSrrS.",
      "..hsSSSSSs..",
      "...ssSSSs...",
      "....sss.....",
    ],
  },
  torso: {
    y: 17,
    sideX: 11,
    front: [
      "..GJNttttNjj..",
      ".GGJNTTTtNJjj.",
      "GGJJNTTTtNJJjj",
      "GJJJNTTTtNJJjj",
      "GJJJNTTTtNJJjj",
      "GJJJNTTTtNJJjj",
      "GJJJNTTTtNJJjj",
      "GJJJNKYYKNJJjj",
      "GJJJNPPPPNJJjj",
      "GJJJNPPPPNJjjj",
      "GJJjN....NjJjj",
      "GJjj......jjjj",
    ],
    back: [
      "..GNNNNNNNNj..",
      ".GGJJJJJJJJjj.",
      "GGJJJJJJJJJJjj",
      "GJJJJJJJJJJJjj",
      "GJJJJNNNNJJJjj",
      "GJJJJNJJNJJJjj",
      "GJJJJNNNNJJJjj",
      "GJJJJJJJJJJJjj",
      "GJJJJJJJJJJJjj",
      "GJJJJJjJJJJJjj",
      "GJJJJjjjJJJjjj",
      "GJJjjj..jjjjjj",
    ],
    side: [
      "...GJJJNt.",
      "..GJJJJNTt",
      ".GJJJJJNTT",
      "GJJJJJJNTT",
      "GJJJJJJNTt",
      "GJJJJJJNTT",
      "GJJJJJJNTT",
      "GJJJJJJNKY",
      "GJJJJJJjNP",
      "GJJJJJjjNP",
      "GJJJJjjjjN",
      "GJJjjjjjj.",
    ],
  },
  arms: {
    width: 3,
    shoulderY: 19,
    wristY: 26,
    frontX: 10,
    sideX: 15,
    right: PLAYER_SLEEVE,
    left: PLAYER_SLEEVE,
  },
  legs: {
    width: 3,
    hipY: 27,
    frontX: 13,
    sideX: 15,
    base: "P",
    shade: "p",
    bootFront: [".BBb.", ".BBb.", "BBBbb", "bbbbb"],
    bootSide: ["BBb..", "BBBBb", "bbbbb"],
  },
};

// ---------------------------------------------------------------------------
// Jake the bartender: heavy build, buzz cut and beard, cyber eye with a
// temple plate, chrome cyber arm (his left), sleeveless vest.
// ---------------------------------------------------------------------------

export const BARTENDER_DESIGN: CharacterDesign = {
  palette: {
    K: 0x14121a,
    L: 0x6a5446, // stubble highlight
    H: 0x3e2c24, // buzz cut / beard
    h: 0x261a15,
    S: 0xc68a64, // skin
    s: 0x8f5a3e,
    r: 0x5a2a22, // mouth
    R: 0xff3030, // cyber eye glow
    M: 0xd2dbe8, // chrome
    m: 0x7a8496, // chrome shade
    G: 0x6e6a8a, // vest highlight
    J: 0x45405e, // vest
    j: 0x2a263c, // vest shade
    N: 0xff3b6b, // neon trim
    T: 0x4a4a55, // tank top
    t: 0x33333c,
    Y: 0xc0c0c8, // buckle
    P: 0x2e2e38, // trousers
    p: 0x1e1e26,
    B: 0x4e4a56, // boots
    b: 0x2c2a32,
  },
  head: {
    y: 4,
    sideX: 10,
    front: [
      "..LLHHHHhh..",
      ".LHHHHHHHMm.",
      ".SSSSSSSSMm.",
      "SSKKSSSKKMmS",
      "SSSKSSSSRMSs",
      "SSSSSSSSSSSs",
      ".SSSSssSSSs.",
      ".HSHHHHHHSh.",
      ".HHHrrrrHHh.",
      ".HHHHHHHHHh.",
      "..hHHHHHHh..",
      "...hhhhhh...",
      "...ssssss...",
    ],
    back: [
      "..LLHHHHhh..",
      ".MmHHHHHHHh.",
      ".MmHHHHHHHh.",
      "sMmHHHHHHHhs",
      "sHHHHHHHHHhs",
      "sHHHHHHHHHhs",
      ".HHHHHHHHHh.",
      ".hHHHHHHHhh.",
      ".hHHHHHHHhh.",
      ".sSSSSSSSSs.",
      "..sSSSSSSs..",
      "...ssssss...",
      "...ssssss...",
    ],
    // His left side: temple plate and glowing eye.
    side: [
      "..LLHHHHh...",
      ".LHHHHHMmh..",
      "LHHHHHMMmSS.",
      "HHHHHHMmKKSS",
      "HHHHsSMmSRSS",
      "hHHsSSSSSSSS",
      "hHHsSSSSSSs.",
      ".hHsSSSHHHH.",
      ".hHHHHHHrrH.",
      ".hHHHHHHHHh.",
      "..hHHHHHHh..",
      "...hhhhhh...",
      "...ssssss...",
    ],
    sideRight: [
      "..LLHHHHh...",
      ".LHHHHHHHh..",
      "LHHHHHHHHSS.",
      "HHHHHHHHKKSS",
      "HHHHsSSSSKSS",
      "hHHsSSSSSSSS",
      "hHHsSSSSSSs.",
      ".hHsSSSHHHH.",
      ".hHHHHHHrrH.",
      ".hHHHHHHHHh.",
      "..hHHHHHHh..",
      "...hhhhhh...",
      "...ssssss...",
    ],
  },
  torso: {
    y: 16,
    sideX: 10,
    front: [
      "..GGJJNTTTTNJJjj..",
      ".GGJJJNTTTTNJJJjj.",
      "GGJJJJNTTTTNJJJJjj",
      "GJJJJJNTTTtNJJJJjj",
      "GJJJJJNTTTtNJJJJjj",
      "GJJJJJNTTTtNJJJJjj",
      "GJJJJJNTTTtNJJJJjj",
      ".GJJJJNTTTtNJJJjj.",
      ".GJJJJNTTTtNJJJjj.",
      ".KKKKKKKYYKKKKKKK.",
      "..PPPPPPPPPPPPpp..",
      "..PPPPPPPPPPPPpp..",
    ],
    back: [
      "..GGJJJJJJJJJJjj..",
      ".GGJJJJJJJJJJJJjj.",
      "GGJJJJJJJJJJJJJJjj",
      "GJJJJJJJJJJJJJJJjj",
      "GJJJNNNNNNNNNNJJjj",
      "GJJJJJJJJJJJJJJJjj",
      "GJJJJJJJJJJJJJJJjj",
      ".GJJJJJJJJJJJJJjj.",
      ".GJJJJJJJJJJJJJjj.",
      ".KKKKKKKKKKKKKKKK.",
      "..PPPPPPPPPPPPpp..",
      "..PPPPPPPPPPPPpp..",
    ],
    side: [
      "..GJJJJJNT...",
      ".GJJJJJJNTT..",
      "GJJJJJJJNTTT.",
      "GJJJJJJJNTTT.",
      "GJJJJJJJNTTTt",
      "GJJJJJJJNTTTt",
      "GJJJJJJJNTTTt",
      ".GJJJJJJNTTt.",
      ".GJJJJJJNTTt.",
      ".KKKKKKKKKKY.",
      ".PPPPPPPPPPp.",
      ".PPPPPPPPPpp.",
    ],
  },
  arms: {
    width: 4,
    shoulderY: 19,
    wristY: 26,
    frontX: 8,
    sideX: 15,
    right: { base: "S", shade: "s", hand: ["SSS", "sss"] },
    left: { base: "M", shade: "m", hand: ["MMM", "mmm"] },
  },
  legs: {
    width: 4,
    hipY: 27,
    frontX: 13,
    sideX: 15,
    base: "P",
    shade: "p",
    bootFront: [".BBBb.", "BBBBbb", "bbbbbb"],
    bootSide: ["BBBb..", "BBBBBb", "bbbbbb"],
  },
};

// ---------------------------------------------------------------------------
// Maya the street vendor: slight build, neon bob with an undercut on her
// left, wraparound visor, cropped bomber jacket, cargo pants, platform boots.
// ---------------------------------------------------------------------------

export const VENDOR_DESIGN: CharacterDesign = {
  palette: {
    K: 0x160f20,
    L: 0xff9ad8, // hair highlight
    H: 0xff4fb0, // hair
    h: 0xa8237a,
    U: 0x5a3a5e, // undercut stubble
    S: 0xe9b99a, // skin
    s: 0xb98066,
    r: 0xc04060, // lipstick
    V: 0x6ff7ff, // visor glow
    v: 0x1fa8c0, // visor rim / strap
    G: 0xa07aff, // jacket highlight
    J: 0x6a3ad0, // jacket
    j: 0x42228a,
    N: 0xfff05a, // neon trim
    T: 0x24242e, // crop top
    t: 0x15151c,
    Y: 0xfff05a, // glowing belt pouch
    P: 0x4f5e4a, // cargo pants
    p: 0x343f31,
    B: 0x33333f, // platform boots
    b: 0x1c1c24,
  },
  head: {
    y: 7,
    sideX: 10,
    front: [
      "...LLHHHH...",
      ".LLHHHHHHHU.",
      "LHHHHHHHHHUU",
      "HHHHHHHHSSUU",
      "HHHHHSSSSSSU",
      "HHVVVVVVVVvU",
      "HHSSSSsSSSs.",
      "HhSSSrrSSs..",
      "Hh.sSSSSs...",
      "hh..sSSs....",
      "h...ssss....",
    ],
    back: [
      "...LLHHHH...",
      ".ULHHHHHHHh.",
      "UULHHHHHHHHh",
      "UUUHHHHHHHHh",
      "UUUHHHHHHHHh",
      "vvvvvvvvvvvv",
      "sUUHHHHHHHHh",
      ".UUhHHHHHHhh",
      ".sssHHHHHhhh",
      "....sSSshhh.",
      "....ssss..hh",
    ],
    // Her left side: shaved undercut, visor wrapping round.
    side: [
      "...LLHHHH...",
      "..LHHHHHHHH.",
      ".UUHHHHHHHHH",
      "UUUUUUUHHHHS",
      "UUUUUSSSSSHS",
      "UUvvvvvvVVVV",
      "UUUsSSSSSSSS",
      ".UUsSSSSSrS.",
      "..UUsSSSSs..",
      "....sSSs....",
      "....ssss....",
    ],
    sideRight: [
      "...LLHHHH...",
      "..LHHHHHHHH.",
      ".LHHHHHHHHHH",
      "HHHHHHHHHHHS",
      "HHHHHSSSSSHS",
      "HHvvvvvvVVVV",
      "HHHsSSSSSSSS",
      "HHHsSSSSSrS.",
      "HhhhsSSSSs..",
      "hhh.sSSs....",
      "hh..ssss....",
    ],
  },
  torso: {
    y: 18,
    sideX: 11,
    front: [
      "..GJJttJJj..",
      ".GGJJTTJJjj.",
      "GGJJJTTJJJjj",
      "GJJJJTTJJJjj",
      "GJJJJTtJJJjj",
      "NNNNNTtNNNNN",
      "..SSSSSSss..",
      "..KKKYKKKK..",
      "..PPPPPPPp..",
      "..PPPPPPpp..",
    ],
    back: [
      "..GNNNNNNj..",
      ".GGJJJJJJjj.",
      "GGJJJJJJJJjj",
      "GJJJNNNNJJjj",
      "GJJJJNNJJJjj",
      "NNNNNNNNNNNN",
      "..SSSSSSss..",
      "..KKKKKKKK..",
      "..PPPPPPPp..",
      "..PPPPPPpp..",
    ],
    side: [
      "..GJJJt..",
      ".GJJJJTT.",
      "GJJJJJTT.",
      "GJJJJJJTT",
      "GJJJJJJTt",
      "NNNNNNNNt",
      "..SSSSSs.",
      "..KKKKKY.",
      "..PPPPPPp",
      "..PPPPPPp",
    ],
  },
  arms: {
    width: 3,
    shoulderY: 20,
    wristY: 26,
    frontX: 11,
    sideX: 15,
    right: { base: "J", shade: "j", hand: ["SS", "ss"] },
    left: { base: "J", shade: "j", hand: ["SS", "ss"] },
  },
  legs: {
    width: 3,
    hipY: 27,
    frontX: 13,
    sideX: 15,
    base: "P",
    shade: "p",
    bootFront: [".BBb.", ".BBb.", "BBBbb", "bbbbb", "bbbbb"],
    bootSide: ["BBb..", "BBBBb", "bbbbb", "bbbbb"],
  },
};

// ---------------------------------------------------------------------------
// Mechanic: stocky, neon mohawk, welding goggles, respirator mask, hazard
// orange jumpsuit with reflective stripes, tool belt, heavy gloves.
// ---------------------------------------------------------------------------

const MECHANIC_SLEEVE: ArmStyle = {
  base: "J",
  shade: "j",
  hand: ["WWW", "www"],
};

export const MECHANIC_DESIGN: CharacterDesign = {
  // His mouth is covered, so the respirator vents glow amber when he talks.
  talkSwap: { q: "V" },
  palette: {
    K: 0x16121a,
    L: 0xb0ffc0, // mohawk highlight
    H: 0x5aff7a, // mohawk
    h: 0x20a040,
    S: 0xc98b62, // skin
    s: 0x9a6343,
    M: 0x9aa4b4, // goggle frame
    m: 0x5a6270,
    V: 0xffb020, // amber lenses
    Q: 0x4a4f5a, // respirator
    q: 0x2e323a,
    G: 0xffa040, // jumpsuit highlight
    J: 0xe06a10, // jumpsuit
    j: 0x9a4208,
    N: 0xe8f0ff, // reflective stripe
    T: 0x3a3a44, // undershirt
    t: 0x26262e,
    Y: 0xc0c8d0, // zip / tools
    W: 0x44444e, // gloves
    w: 0x2a2a32,
    P: 0xe06a10, // jumpsuit legs
    p: 0x9a4208,
    B: 0x5a4a3a, // work boots
    b: 0x3a2e24,
  },
  head: {
    y: 4,
    sideX: 10,
    front: [
      ".....LH.....",
      "....LHHh....",
      "...SLHHhS...",
      "..SSSHHhSs..",
      ".MMMMMMMMMm.",
      ".MVVmMMmVVm.",
      ".SSSSSSSSSs.",
      ".SSKSSSSKSs.",
      ".QQQQQQQQQq.",
      ".QqQqQQqQqq.",
      "..QQQQQQQq..",
      "....ssss....",
      "....ssss....",
    ],
    back: [
      ".....LH.....",
      "....LHHh....",
      "...SLHHhS...",
      "..SSSHHhSs..",
      ".MMMMMMMMMm.",
      ".SSSSHHhSSs.",
      ".SSSSHHhSSs.",
      ".sSSSSHhSss.",
      ".qqqqqqqqqq.",
      "..sSSSSSSs..",
      "..ssSSSSss..",
      "....ssss....",
      "....ssss....",
    ],
    side: [
      "...LHH......",
      "..LHHHHh....",
      ".SSSHHHHhS..",
      "SSSSSSSSSSS.",
      "MMMMMMMMVVm.",
      "SSssSSSSSSSS",
      "SSssSSSSKSSS",
      "SSSSSSSSSSSS",
      ".SSSSQQQQQQq",
      ".sSSSQqQqQq.",
      "..sSSQQQQq..",
      "...ssss.....",
      "...ssss.....",
    ],
  },
  torso: {
    y: 16,
    sideX: 11,
    front: [
      "...GJJJttJJjj...",
      ".GGJJJJTTJJJJjj.",
      "GGJJJJJYYJJJJJjj",
      "NNNNNNNYYNNNNNNN",
      "GJJJJJJYYJJJJJjj",
      "GJJJJJJYYJJJJJjj",
      "NNNNNNNYYNNNNNNN",
      "GJJJJJJYYJJJJJjj",
      "KKYYKKKKKKKKYYKK",
      ".GJJJJJJJJJJJjj.",
      ".GJJJJJJJJJJjjj.",
    ],
    back: [
      "...GJJJJJJJjj...",
      ".GGJJJJJJJJJJjj.",
      "GGJJJJJJJJJJJJjj",
      "NNNNNNNNNNNNNNNN",
      "GJJJJJJJJJJJJJjj",
      "GJJJJJJJJJJJJJjj",
      "NNNNNNNNNNNNNNNN",
      "GJJJJJJJJJJJJJjj",
      "KKYYKKKKKKKKYYKK",
      ".GJJJJJJJJJJJjj.",
      ".GJJJJJJJJJJjjj.",
    ],
    side: [
      "..GJJJJtt..",
      ".GJJJJJJTT.",
      "GJJJJJJJJYJ",
      "NNNNNNNNNYN",
      "GJJJJJJJJYJ",
      "GJJJJJJJJYJ",
      "NNNNNNNNNYN",
      "GJJJJJJJJYJ",
      "KKKYYKKKKKK",
      ".GJJJJJJJjj",
      ".GJJJJJJjjj",
    ],
  },
  arms: {
    width: 4,
    shoulderY: 18,
    wristY: 25,
    frontX: 9,
    sideX: 15,
    right: MECHANIC_SLEEVE,
    left: MECHANIC_SLEEVE,
  },
  legs: {
    width: 4,
    hipY: 26,
    frontX: 13,
    sideX: 15,
    base: "P",
    shade: "p",
    bootFront: [".BBBb.", "BBBBbb", "bbbbbb"],
    bootSide: ["BBBb..", "BBBBBb", "bbbbbb"],
  },
};

/** Designs by NPC sprite type. "basic" NPCs share the player's look. */
export const CHARACTER_DESIGNS: Record<string, CharacterDesign> = {
  basic: PLAYER_DESIGN,
  bartender: BARTENDER_DESIGN,
  customer: VENDOR_DESIGN,
  mechanic: MECHANIC_DESIGN,
};
