{
 "patcher": {
  "fileversion": 1,
  "appversion": {
   "major": 8,
   "minor": 6,
   "revision": 0,
   "architecture": "x64",
   "modernui": 1
  },
  "classnamespace": "box",
  "rect": [
   128.0,
   144.0,
   1600.0,
   900.0
  ],
  "openrect": [
   0.0,
   0.0,
   0.0,
   169.0
  ],
  "bglocked": 0,
  "openinpresentation": 1,
  "default_fontsize": 10.0,
  "default_fontface": 0,
  "default_fontname": "Arial Bold",
  "gridonopen": 1,
  "gridsize": [
   8.0,
   8.0
  ],
  "gridsnaponopen": 1,
  "objectsnaponopen": 1,
  "statusbarvisible": 2,
  "toolbarvisible": 1,
  "lefttoolbarpinned": 0,
  "toptoolbarpinned": 0,
  "righttoolbarpinned": 0,
  "bottomtoolbarpinned": 0,
  "toolbars_unpinned_last_save": 0,
  "tallnewobj": 0,
  "boxanimatetime": 500,
  "enablehscroll": 1,
  "enablevscroll": 1,
  "devicewidth": 0.0,
  "description": "",
  "digest": "",
  "tags": "",
  "style": "",
  "subpatcher_template": "",
  "assistshowspatchername": 0,
  "parameters": {
   "obj-57::obj-13": [
    "Wave",
    "Wave",
    0
   ],
   "obj-57::obj-14": [
    "PWM",
    "PWM",
    0
   ],
   "obj-57::obj-15": [
    "Fold",
    "Fold",
    0
   ],
   "obj-57::obj-18": [
    "Sub",
    "Sub",
    0
   ],
   "obj-57::obj-19": [
    "SubSat",
    "SubSat",
    0
   ],
   "obj-57::obj-20": [
    "SubOct",
    "SubOct",
    0
   ],
   "obj-57::obj-23": [
    "Squelch",
    "Squelch",
    0
   ],
   "obj-57::obj-24": [
    "Cutoff",
    "Cutoff",
    0
   ],
   "obj-57::obj-25": [
    "Decay",
    "Decay",
    0
   ],
   "obj-57::obj-26": [
    "Drive",
    "Drive",
    0
   ],
   "obj-57::obj-27": [
    "Mode",
    "Mode",
    0
   ],
   "obj-57::obj-30": [
    "Chunk",
    "Chunk",
    0
   ],
   "obj-57::obj-31": [
    "WobRate",
    "WobRate",
    0
   ],
   "obj-57::obj-32": [
    "WobDepth",
    "WobDepth",
    0
   ],
   "obj-57::obj-35": [
    "Wet",
    "Wet",
    0
   ],
   "obj-57::obj-36": [
    "Width",
    "Width",
    0
   ],
   "obj-57::obj-39": [
    "Design",
    "Design",
    0
   ],
   "obj-57::obj-59::obj-8": [
    "Novelty",
    "Novelty",
    0
   ],
   "obj-57::obj-59::obj-9": [
    "Density",
    "Density",
    0
   ],
   "obj-57::obj-59::obj-10": [
    "Interlock",
    "Interlock",
    0
   ],
   "obj-57::obj-59::obj-11": [
    "Groove",
    "Groove",
    0
   ],
   "obj-57::obj-59::obj-12": [
    "Root",
    "Root",
    0
   ],
   "obj-57::obj-59::obj-13": [
    "Length",
    "Length",
    0
   ],
   "obj-57::obj-59::obj-16": [
    "Lock",
    "Lock",
    0
   ],
   "obj-57::obj-59::obj-18": [
    "FrzRhythm",
    "FrzRhythm",
    0
   ],
   "obj-57::obj-59::obj-20": [
    "FrzPitch",
    "FrzPitch",
    0
   ],
   "obj-57::obj-59::obj-22": [
    "FrzTimbre",
    "FrzTimbre",
    0
   ],
   "parameterbanks": {
    "0": {
     "index": 0,
     "name": "",
     "parameters": [
      "Wave",
      "PWM",
      "Fold",
      "Sub",
      "SubSat",
      "SubOct",
      "Squelch",
      "Cutoff"
     ]
    },
    "1": {
     "index": 1,
     "name": "",
     "parameters": [
      "Decay",
      "Drive",
      "Mode",
      "Chunk",
      "WobRate",
      "WobDepth",
      "Wet",
      "Width"
     ]
    },
    "2": {
     "index": 2,
     "name": "",
     "parameters": [
      "Design",
      "Novelty",
      "Density",
      "Interlock",
      "Groove",
      "Root",
      "Length",
      "Lock"
     ]
    },
    "3": {
     "index": 3,
     "name": "",
     "parameters": [
      "FrzRhythm",
      "FrzPitch",
      "FrzTimbre",
      "-",
      "-",
      "-",
      "-",
      "-"
     ]
    }
   },
   "inherited_shortname": 1
  },
  "dependency_cache": [],
  "latency": 0,
  "is_mpe": 0,
  "minimum_live_version": "",
  "minimum_max_version": "",
  "platform_compatibility": 0,
  "project": {
   "version": 1,
   "creationdate": 3590052838,
   "modificationdate": 3590052838,
   "viewrect": [
    0.0,
    0.0,
    300.0,
    500.0
   ],
   "autoorganize": 0,
   "hideprojectwindow": 1,
   "showdependencies": 1,
   "autolocalize": 0,
   "contents": {
    "patchers": {}
   },
   "layout": {},
   "searchpath": {},
   "detailsvisible": 0,
   "amxdtype": 1768515945,
   "readonly": 0,
   "devpathtype": 0,
   "devpath": ".",
   "sortmode": 0,
   "viewmode": 0,
   "includepackages": 0
  },
  "autosave": 0,
  "boxes": [
   {
    "box": {
     "id": "obj-1",
     "maxclass": "comment",
     "numinlets": 1,
     "numoutlets": 0,
     "patching_rect": [
      30,
      30,
      140,
      22
     ],
     "text": "PG BASS GENERATOR \u2014 Primordial Groove",
     "presentation": 1,
     "presentation_rect": [
      4.0,
      3.0,
      260.0,
      16.0
     ],
     "fontface": 1,
     "fontsize": 11.0
    }
   },
   {
    "box": {
     "id": "obj-2",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 4,
     "patching_rect": [
      220,
      30,
      140,
      22
     ],
     "text": "js pg-core.js",
     "outlettype": [
      "",
      "",
      "",
      ""
     ]
    }
   },
   {
    "box": {
     "id": "obj-3",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      410,
      30,
      140,
      22
     ],
     "text": "metro 16n @active 1 @quantize 16n",
     "outlettype": [
      "bang"
     ]
    }
   },
   {
    "box": {
     "id": "obj-4",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 2,
     "patching_rect": [
      600,
      30,
      140,
      22
     ],
     "text": "t b b",
     "outlettype": [
      "bang",
      "bang"
     ]
    }
   },
   {
    "box": {
     "id": "obj-5",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 8,
     "patching_rect": [
      790,
      30,
      140,
      22
     ],
     "text": "transport",
     "outlettype": [
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      ""
     ]
    }
   },
   {
    "box": {
     "id": "obj-6",
     "maxclass": "newobj",
     "numinlets": 3,
     "numoutlets": 1,
     "patching_rect": [
      980,
      30,
      140,
      22
     ],
     "text": "pack 1 1 0",
     "outlettype": [
      ""
     ]
    }
   },
   {
    "box": {
     "id": "obj-7",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      1170,
      30,
      140,
      22
     ],
     "text": "prepend pos",
     "outlettype": [
      ""
     ]
    }
   },
   {
    "box": {
     "id": "obj-8",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 37,
     "patching_rect": [
      1360,
      30,
      140,
      22
     ],
     "text": "route cutoff reso envd drv post gain adec asus sub wet duck fb dly dly2 lpamt bpamt nlin nlout shelf wamt wflr wdec dmod subdrv subgain subduck asym width monof wave pw fold wobrate wobcut wobpitch state",
     "outlettype": [
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      ""
     ]
    }
   },
   {
    "box": {
     "id": "obj-9",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 9,
     "patching_rect": [
      30,
      120,
      140,
      22
     ],
     "text": "route pitch spitch trig fmul dmul fdec asym note",
     "outlettype": [
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      ""
     ]
    }
   },
   {
    "box": {
     "id": "obj-10",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 3,
     "patching_rect": [
      220,
      120,
      140,
      22
     ],
     "text": "route disp dump",
     "outlettype": [
      "",
      "",
      ""
     ]
    }
   },
   {
    "box": {
     "id": "obj-11",
     "maxclass": "message",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      410,
      120,
      140,
      22
     ],
     "text": "\u2026",
     "outlettype": [
      ""
     ],
     "presentation": 1,
     "presentation_rect": [
      352.0,
      3.0,
      252.0,
      16.0
     ],
     "fontsize": 9.0
    }
   },
   {
    "box": {
     "id": "obj-12",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      600,
      120,
      140,
      22
     ],
     "text": "prepend set",
     "outlettype": [
      ""
     ]
    }
   },
   {
    "box": {
     "id": "obj-13",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 3,
     "patching_rect": [
      790,
      120,
      140,
      22
     ],
     "text": "live.thisdevice",
     "outlettype": [
      "bang",
      "int",
      "int"
     ]
    }
   },
   {
    "box": {
     "id": "obj-14",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 2,
     "patching_rect": [
      980,
      120,
      140,
      22
     ],
     "text": "t b b",
     "outlettype": [
      "bang",
      "bang"
     ]
    }
   },
   {
    "box": {
     "id": "obj-15",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 3,
     "patching_rect": [
      1170,
      120,
      140,
      22
     ],
     "text": "pattr pg_state",
     "outlettype": [
      "",
      "",
      ""
     ]
    }
   },
   {
    "box": {
     "id": "obj-16",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      1360,
      120,
      140,
      22
     ],
     "text": "prepend Restore",
     "outlettype": [
      ""
     ]
    }
   },
   {
    "box": {
     "id": "obj-17",
     "maxclass": "message",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      30,
      210,
      140,
      22
     ],
     "text": "pushall",
     "outlettype": [
      ""
     ]
    }
   },
   {
    "box": {
     "id": "obj-18",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      220,
      210,
      140,
      22
     ],
     "text": "prepend set",
     "outlettype": [
      ""
     ]
    }
   },
   {
    "box": {
     "id": "obj-19",
     "maxclass": "jsui",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      410,
      210,
      140,
      22
     ],
     "outlettype": [
      ""
     ],
     "presentation": 1,
     "presentation_rect": [
      8.0,
      24.0,
      952.0,
      138.0
     ],
     "filename": "pg-lane.js",
     "jsarguments": [
      "rack"
     ],
     "border": 0,
     "parameter_enable": 0
    }
   },
   {
    "box": {
     "id": "obj-20",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 2,
     "patching_rect": [
      600,
      210,
      140,
      22
     ],
     "text": "line~",
     "outlettype": [
      "signal",
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-21",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 2,
     "patching_rect": [
      790,
      210,
      140,
      22
     ],
     "text": "line~",
     "outlettype": [
      "signal",
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-22",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 2,
     "patching_rect": [
      980,
      210,
      140,
      22
     ],
     "text": "line~",
     "outlettype": [
      "signal",
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-23",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 2,
     "patching_rect": [
      1170,
      210,
      140,
      22
     ],
     "text": "line~",
     "outlettype": [
      "signal",
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-24",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 2,
     "patching_rect": [
      1360,
      210,
      140,
      22
     ],
     "text": "line~",
     "outlettype": [
      "signal",
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-25",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 2,
     "patching_rect": [
      30,
      300,
      140,
      22
     ],
     "text": "line~",
     "outlettype": [
      "signal",
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-26",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 2,
     "patching_rect": [
      220,
      300,
      140,
      22
     ],
     "text": "line~",
     "outlettype": [
      "signal",
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-27",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 2,
     "patching_rect": [
      410,
      300,
      140,
      22
     ],
     "text": "line~",
     "outlettype": [
      "signal",
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-28",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 2,
     "patching_rect": [
      600,
      300,
      140,
      22
     ],
     "text": "line~",
     "outlettype": [
      "signal",
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-29",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 2,
     "patching_rect": [
      790,
      300,
      140,
      22
     ],
     "text": "line~",
     "outlettype": [
      "signal",
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-30",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 2,
     "patching_rect": [
      980,
      300,
      140,
      22
     ],
     "text": "line~",
     "outlettype": [
      "signal",
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-31",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 2,
     "patching_rect": [
      1170,
      300,
      140,
      22
     ],
     "text": "line~",
     "outlettype": [
      "signal",
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-32",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 2,
     "patching_rect": [
      1360,
      300,
      140,
      22
     ],
     "text": "line~",
     "outlettype": [
      "signal",
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-33",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      30,
      390,
      140,
      22
     ],
     "text": "cycle~",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-34",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      220,
      390,
      140,
      22
     ],
     "text": "*~ 0.",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-35",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      410,
      390,
      140,
      22
     ],
     "text": "*~ 0.",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-36",
     "maxclass": "newobj",
     "numinlets": 5,
     "numoutlets": 1,
     "patching_rect": [
      600,
      390,
      140,
      22
     ],
     "text": "adsr~ 2 260 0.35 60",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-37",
     "maxclass": "newobj",
     "numinlets": 5,
     "numoutlets": 1,
     "patching_rect": [
      790,
      390,
      140,
      22
     ],
     "text": "adsr~ 1 300 0. 80",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-38",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      980,
      390,
      140,
      22
     ],
     "text": "+~",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-39",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      1170,
      390,
      140,
      22
     ],
     "text": "mtof~",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-40",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      1360,
      390,
      140,
      22
     ],
     "text": "saw~",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-41",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      30,
      480,
      140,
      22
     ],
     "text": "rect~",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-42",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      220,
      480,
      140,
      22
     ],
     "text": "!-~ 1.",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-43",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      410,
      480,
      140,
      22
     ],
     "text": "*~",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-44",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      600,
      480,
      140,
      22
     ],
     "text": "*~",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-45",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      790,
      480,
      140,
      22
     ],
     "text": "*~ 0.85",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-46",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      980,
      480,
      140,
      22
     ],
     "text": "*~ 0.75",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-47",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      1170,
      480,
      140,
      22
     ],
     "text": "+~",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-48",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      1360,
      480,
      140,
      22
     ],
     "text": "*~ 3.2",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-49",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      30,
      570,
      140,
      22
     ],
     "text": "+~ 1.",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-50",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      220,
      570,
      140,
      22
     ],
     "text": "*~",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-51",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      410,
      570,
      140,
      22
     ],
     "text": "sig~ 0.",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-52",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      600,
      570,
      140,
      22
     ],
     "text": "cycle~",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-53",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      790,
      570,
      140,
      22
     ],
     "text": "!-~ 1.",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-54",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      980,
      570,
      140,
      22
     ],
     "text": "*~",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-55",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      1170,
      570,
      140,
      22
     ],
     "text": "*~",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-56",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      1360,
      570,
      140,
      22
     ],
     "text": "+~",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-57",
     "maxclass": "newobj",
     "text": "p wave_window",
     "numinlets": 4,
     "numoutlets": 1,
     "patching_rect": [
      30,
      660,
      140,
      22
     ],
     "patcher": {
      "fileversion": 1,
      "appversion": {
       "major": 8,
       "minor": 6,
       "revision": 0,
       "architecture": "x64",
       "modernui": 1
      },
      "classnamespace": "box",
      "rect": [
       160.0,
       100.0,
       980.0,
       628.0
      ],
      "bglocked": 0,
      "openinpresentation": 1,
      "default_fontsize": 10.0,
      "default_fontface": 0,
      "default_fontname": "Arial Bold",
      "gridonopen": 1,
      "gridsize": [
       8.0,
       8.0
      ],
      "gridsnaponopen": 1,
      "objectsnaponopen": 1,
      "statusbarvisible": 2,
      "toolbarvisible": 1,
      "lefttoolbarpinned": 0,
      "toptoolbarpinned": 0,
      "righttoolbarpinned": 0,
      "bottomtoolbarpinned": 0,
      "toolbars_unpinned_last_save": 0,
      "tallnewobj": 0,
      "boxanimatetime": 500,
      "enablehscroll": 1,
      "enablevscroll": 1,
      "devicewidth": 0.0,
      "description": "",
      "digest": "",
      "tags": "",
      "style": "",
      "subpatcher_template": "",
      "assistshowspatchername": 0,
      "parameters": {
       "obj-13": [
        "Wave",
        "Wave",
        0
       ],
       "obj-14": [
        "PWM",
        "PWM",
        0
       ],
       "obj-15": [
        "Fold",
        "Fold",
        0
       ],
       "obj-18": [
        "Sub",
        "Sub",
        0
       ],
       "obj-19": [
        "SubSat",
        "SubSat",
        0
       ],
       "obj-20": [
        "SubOct",
        "SubOct",
        0
       ],
       "obj-23": [
        "Squelch",
        "Squelch",
        0
       ],
       "obj-24": [
        "Cutoff",
        "Cutoff",
        0
       ],
       "obj-25": [
        "Decay",
        "Decay",
        0
       ],
       "obj-26": [
        "Drive",
        "Drive",
        0
       ],
       "obj-27": [
        "Mode",
        "Mode",
        0
       ],
       "obj-30": [
        "Chunk",
        "Chunk",
        0
       ],
       "obj-31": [
        "WobRate",
        "WobRate",
        0
       ],
       "obj-32": [
        "WobDepth",
        "WobDepth",
        0
       ],
       "obj-35": [
        "Wet",
        "Wet",
        0
       ],
       "obj-36": [
        "Width",
        "Width",
        0
       ],
       "obj-39": [
        "Design",
        "Design",
        0
       ],
       "obj-59::obj-8": [
        "Novelty",
        "Novelty",
        0
       ],
       "obj-59::obj-9": [
        "Density",
        "Density",
        0
       ],
       "obj-59::obj-10": [
        "Interlock",
        "Interlock",
        0
       ],
       "obj-59::obj-11": [
        "Groove",
        "Groove",
        0
       ],
       "obj-59::obj-12": [
        "Root",
        "Root",
        0
       ],
       "obj-59::obj-13": [
        "Length",
        "Length",
        0
       ],
       "obj-59::obj-16": [
        "Lock",
        "Lock",
        0
       ],
       "obj-59::obj-18": [
        "FrzRhythm",
        "FrzRhythm",
        0
       ],
       "obj-59::obj-20": [
        "FrzPitch",
        "FrzPitch",
        0
       ],
       "obj-59::obj-22": [
        "FrzTimbre",
        "FrzTimbre",
        0
       ],
       "parameterbanks": {
        "0": {
         "index": 0,
         "name": "",
         "parameters": [
          "Wave",
          "PWM",
          "Fold",
          "Sub",
          "SubSat",
          "SubOct",
          "Squelch",
          "Cutoff"
         ]
        },
        "1": {
         "index": 1,
         "name": "",
         "parameters": [
          "Decay",
          "Drive",
          "Mode",
          "Chunk",
          "WobRate",
          "WobDepth",
          "Wet",
          "Width"
         ]
        },
        "2": {
         "index": 2,
         "name": "",
         "parameters": [
          "Design",
          "Novelty",
          "Density",
          "Interlock",
          "Groove",
          "Root",
          "Length",
          "Lock"
         ]
        },
        "3": {
         "index": 3,
         "name": "",
         "parameters": [
          "FrzRhythm",
          "FrzPitch",
          "FrzTimbre",
          "-",
          "-",
          "-",
          "-",
          "-"
         ]
        }
       },
       "inherited_shortname": 1
      },
      "dependency_cache": [],
      "latency": 0,
      "is_mpe": 0,
      "minimum_live_version": "",
      "minimum_max_version": "",
      "platform_compatibility": 0,
      "autosave": 0,
      "boxes": [
       {
        "box": {
         "id": "obj-41",
         "maxclass": "jsui",
         "numinlets": 1,
         "numoutlets": 1,
         "patching_rect": [
          30,
          480,
          140,
          22
         ],
         "outlettype": [
          ""
         ],
         "presentation": 1,
         "presentation_rect": [
          132.0,
          482.0,
          160.0,
          70.0
         ],
         "filename": "pg-mod.js",
         "jsarguments": [
          "wobrate",
          36.0,
          30.9,
          12.96,
          "wobcut",
          124.0,
          30.9,
          12.96
         ],
         "border": 0,
         "parameter_enable": 0,
         "ignoreclick": 1
        }
       },
       {
        "box": {
         "id": "obj-40",
         "maxclass": "jsui",
         "numinlets": 1,
         "numoutlets": 1,
         "patching_rect": [
          1360,
          390,
          140,
          22
         ],
         "outlettype": [
          ""
         ],
         "presentation": 1,
         "presentation_rect": [
          8.0,
          316.0,
          438.0,
          70.0
         ],
         "filename": "pg-mod.js",
         "jsarguments": [
          "wave",
          36.0,
          30.9,
          12.96,
          "pw",
          124.0,
          30.9,
          12.96,
          "fold",
          212.0,
          30.9,
          12.96,
          "subdrv",
          402.0,
          30.9,
          12.96
         ],
         "border": 0,
         "parameter_enable": 0,
         "ignoreclick": 1
        }
       },
       {
        "box": {
         "id": "obj-2",
         "maxclass": "inlet",
         "numinlets": 0,
         "numoutlets": 1,
         "patching_rect": [
          20.0,
          20.0,
          30.0,
          30.0
         ],
         "outlettype": [
          "signal"
         ],
         "comment": "(signal) audio in"
        }
       },
       {
        "box": {
         "id": "obj-3",
         "maxclass": "inlet",
         "numinlets": 0,
         "numoutlets": 1,
         "patching_rect": [
          60.0,
          20.0,
          30.0,
          30.0
         ],
         "outlettype": [
          ""
         ],
         "comment": "pcontrol target"
        }
       },
       {
        "box": {
         "id": "obj-4",
         "maxclass": "inlet",
         "numinlets": 0,
         "numoutlets": 1,
         "patching_rect": [
          100.0,
          20.0,
          30.0,
          30.0
         ],
         "outlettype": [
          ""
         ],
         "comment": "phrase + steps"
        }
       },
       {
        "box": {
         "id": "obj-5",
         "maxclass": "inlet",
         "numinlets": 0,
         "numoutlets": 1,
         "patching_rect": [
          140.0,
          20.0,
          30.0,
          30.0
         ],
         "outlettype": [
          ""
         ],
         "comment": "synth values, as modulated"
        }
       },
       {
        "box": {
         "id": "obj-6",
         "maxclass": "outlet",
         "numinlets": 1,
         "numoutlets": 0,
         "patching_rect": [
          180.0,
          20.0,
          30.0,
          30.0
         ],
         "comment": "control messages out"
        }
       },
       {
        "box": {
         "id": "obj-7",
         "maxclass": "comment",
         "numinlets": 1,
         "numoutlets": 0,
         "patching_rect": [
          1170,
          30,
          140,
          22
         ],
         "text": "PG BASS GENERATOR",
         "presentation": 1,
         "presentation_rect": [
          8.0,
          8.0,
          600.0,
          20.0
         ],
         "fontface": 1,
         "fontsize": 15.0,
         "textcolor": [
          0.92,
          0.92,
          0.92,
          1.0
         ]
        }
       },
       {
        "box": {
         "id": "obj-8",
         "maxclass": "comment",
         "numinlets": 1,
         "numoutlets": 0,
         "patching_rect": [
          1360,
          30,
          140,
          22
         ],
         "text": "step lane \u00b7 waveform \u00b7 the voice in signal order",
         "presentation": 1,
         "presentation_rect": [
          8.0,
          27.0,
          600.0,
          14.0
         ],
         "fontsize": 10.0,
         "textcolor": [
          0.55,
          0.55,
          0.55,
          1.0
         ]
        }
       },
       {
        "box": {
         "id": "obj-9",
         "maxclass": "jsui",
         "numinlets": 1,
         "numoutlets": 1,
         "patching_rect": [
          30,
          120,
          140,
          22
         ],
         "outlettype": [
          ""
         ],
         "presentation": 1,
         "presentation_rect": [
          8.0,
          46.0,
          944.0,
          140.0
         ],
         "filename": "pg-lane.js",
         "jsarguments": [
          "window"
         ],
         "border": 0,
         "parameter_enable": 0
        }
       },
       {
        "box": {
         "id": "obj-10",
         "maxclass": "scope~",
         "numinlets": 1,
         "numoutlets": 0,
         "patching_rect": [
          220,
          120,
          140,
          22
         ],
         "presentation": 1,
         "presentation_rect": [
          8.0,
          194.0,
          944.0,
          56.0
         ],
         "bgcolor": [
          0.02,
          0.02,
          0.02,
          1.0
         ],
         "bufsize": 4096
        }
       },
       {
        "box": {
         "id": "obj-12",
         "maxclass": "comment",
         "numinlets": 1,
         "numoutlets": 0,
         "patching_rect": [
          600,
          120,
          140,
          22
         ],
         "text": "OSC",
         "presentation": 1,
         "presentation_rect": [
          10.0,
          264.0,
          248.0,
          10.0
         ],
         "fontsize": 8.0,
         "textcolor": [
          0.961,
          0.769,
          0.702,
          1.0
         ]
        }
       },
       {
        "box": {
         "id": "obj-13",
         "maxclass": "live.dial",
         "numinlets": 1,
         "numoutlets": 2,
         "patching_rect": [
          790,
          120,
          140,
          22
         ],
         "outlettype": [
          "",
          "float"
         ],
         "presentation": 1,
         "presentation_rect": [
          8.0,
          316.0,
          72.0,
          70.0
         ],
         "varname": "wave",
         "parameter_enable": 1,
         "saved_attribute_attributes": {
          "valueof": {
           "parameter_initial": [
            0.3
           ],
           "parameter_initial_enable": 1,
           "parameter_longname": "Wave",
           "parameter_mmax": 1.0,
           "parameter_mmin": 0.0,
           "parameter_shortname": "Wave",
           "parameter_type": 0,
           "parameter_unitstyle": 1
          }
         }
        }
       },
       {
        "box": {
         "id": "obj-14",
         "maxclass": "live.dial",
         "numinlets": 1,
         "numoutlets": 2,
         "patching_rect": [
          980,
          120,
          140,
          22
         ],
         "outlettype": [
          "",
          "float"
         ],
         "presentation": 1,
         "presentation_rect": [
          96.0,
          316.0,
          72.0,
          70.0
         ],
         "varname": "pwm",
         "parameter_enable": 1,
         "saved_attribute_attributes": {
          "valueof": {
           "parameter_initial": [
            0.5
           ],
           "parameter_initial_enable": 1,
           "parameter_longname": "PWM",
           "parameter_mmax": 1.0,
           "parameter_mmin": 0.0,
           "parameter_shortname": "PWM",
           "parameter_type": 0,
           "parameter_unitstyle": 1
          }
         }
        }
       },
       {
        "box": {
         "id": "obj-15",
         "maxclass": "live.dial",
         "numinlets": 1,
         "numoutlets": 2,
         "patching_rect": [
          1170,
          120,
          140,
          22
         ],
         "outlettype": [
          "",
          "float"
         ],
         "presentation": 1,
         "presentation_rect": [
          184.0,
          316.0,
          72.0,
          70.0
         ],
         "varname": "fold",
         "parameter_enable": 1,
         "saved_attribute_attributes": {
          "valueof": {
           "parameter_initial": [
            0.0
           ],
           "parameter_initial_enable": 1,
           "parameter_longname": "Fold",
           "parameter_mmax": 1.0,
           "parameter_mmin": 0.0,
           "parameter_shortname": "Fold",
           "parameter_type": 0,
           "parameter_unitstyle": 1
          }
         }
        }
       },
       {
        "box": {
         "id": "obj-17",
         "maxclass": "comment",
         "numinlets": 1,
         "numoutlets": 0,
         "patching_rect": [
          30,
          210,
          140,
          22
         ],
         "text": "SUB",
         "presentation": 1,
         "presentation_rect": [
          288.0,
          264.0,
          160.0,
          10.0
         ],
         "fontsize": 8.0,
         "textcolor": [
          0.624,
          0.882,
          0.796,
          1.0
         ]
        }
       },
       {
        "box": {
         "id": "obj-18",
         "maxclass": "live.dial",
         "numinlets": 1,
         "numoutlets": 2,
         "patching_rect": [
          220,
          210,
          140,
          22
         ],
         "outlettype": [
          "",
          "float"
         ],
         "presentation": 1,
         "presentation_rect": [
          286.0,
          316.0,
          72.0,
          70.0
         ],
         "varname": "sub",
         "parameter_enable": 1,
         "saved_attribute_attributes": {
          "valueof": {
           "parameter_initial": [
            0.6
           ],
           "parameter_initial_enable": 1,
           "parameter_longname": "Sub",
           "parameter_mmax": 1.0,
           "parameter_mmin": 0.0,
           "parameter_shortname": "Sub",
           "parameter_type": 0,
           "parameter_unitstyle": 1
          }
         }
        }
       },
       {
        "box": {
         "id": "obj-19",
         "maxclass": "live.dial",
         "numinlets": 1,
         "numoutlets": 2,
         "patching_rect": [
          410,
          210,
          140,
          22
         ],
         "outlettype": [
          "",
          "float"
         ],
         "presentation": 1,
         "presentation_rect": [
          374.0,
          316.0,
          72.0,
          70.0
         ],
         "varname": "subsat",
         "parameter_enable": 1,
         "saved_attribute_attributes": {
          "valueof": {
           "parameter_initial": [
            0.35
           ],
           "parameter_initial_enable": 1,
           "parameter_longname": "SubSat",
           "parameter_mmax": 1.0,
           "parameter_mmin": 0.0,
           "parameter_shortname": "SubSat",
           "parameter_type": 0,
           "parameter_unitstyle": 1
          }
         }
        }
       },
       {
        "box": {
         "id": "obj-20",
         "maxclass": "live.menu",
         "numinlets": 1,
         "numoutlets": 3,
         "patching_rect": [
          600,
          210,
          140,
          22
         ],
         "outlettype": [
          "",
          "",
          "float"
         ],
         "presentation": 1,
         "presentation_rect": [
          286.0,
          390.0,
          66.0,
          18.0
         ],
         "varname": "suboct",
         "parameter_enable": 1,
         "saved_attribute_attributes": {
          "valueof": {
           "parameter_enum": [
            "sub -1",
            "sub -2"
           ],
           "parameter_initial": [
            0
           ],
           "parameter_initial_enable": 1,
           "parameter_longname": "SubOct",
           "parameter_mmax": 1,
           "parameter_shortname": "SubOct",
           "parameter_type": 2
          }
         }
        }
       },
       {
        "box": {
         "id": "obj-22",
         "maxclass": "comment",
         "numinlets": 1,
         "numoutlets": 0,
         "patching_rect": [
          980,
          210,
          140,
          22
         ],
         "text": "FILTER",
         "presentation": 1,
         "presentation_rect": [
          478.0,
          264.0,
          372.0,
          10.0
         ],
         "fontsize": 8.0,
         "textcolor": [
          0.98,
          0.78,
          0.459,
          1.0
         ]
        }
       },
       {
        "box": {
         "id": "obj-23",
         "maxclass": "live.dial",
         "numinlets": 1,
         "numoutlets": 2,
         "patching_rect": [
          1170,
          210,
          140,
          22
         ],
         "outlettype": [
          "",
          "float"
         ],
         "presentation": 1,
         "presentation_rect": [
          476.0,
          281.0,
          108.0,
          105.0
         ],
         "varname": "squelch",
         "parameter_enable": 1,
         "saved_attribute_attributes": {
          "valueof": {
           "parameter_initial": [
            0.5
           ],
           "parameter_initial_enable": 1,
           "parameter_longname": "Squelch",
           "parameter_mmax": 1.0,
           "parameter_mmin": 0.0,
           "parameter_shortname": "Squelch",
           "parameter_type": 0,
           "parameter_unitstyle": 1
          }
         }
        }
       },
       {
        "box": {
         "id": "obj-24",
         "maxclass": "live.dial",
         "numinlets": 1,
         "numoutlets": 2,
         "patching_rect": [
          1360,
          210,
          140,
          22
         ],
         "outlettype": [
          "",
          "float"
         ],
         "presentation": 1,
         "presentation_rect": [
          600.0,
          316.0,
          72.0,
          70.0
         ],
         "varname": "cutoff",
         "parameter_enable": 1,
         "saved_attribute_attributes": {
          "valueof": {
           "parameter_initial": [
            0.45
           ],
           "parameter_initial_enable": 1,
           "parameter_longname": "Cutoff",
           "parameter_mmax": 1.0,
           "parameter_mmin": 0.0,
           "parameter_shortname": "Cutoff",
           "parameter_type": 0,
           "parameter_unitstyle": 1
          }
         }
        }
       },
       {
        "box": {
         "id": "obj-25",
         "maxclass": "live.dial",
         "numinlets": 1,
         "numoutlets": 2,
         "patching_rect": [
          30,
          300,
          140,
          22
         ],
         "outlettype": [
          "",
          "float"
         ],
         "presentation": 1,
         "presentation_rect": [
          688.0,
          316.0,
          72.0,
          70.0
         ],
         "varname": "decay",
         "parameter_enable": 1,
         "saved_attribute_attributes": {
          "valueof": {
           "parameter_initial": [
            0.5
           ],
           "parameter_initial_enable": 1,
           "parameter_longname": "Decay",
           "parameter_mmax": 1.0,
           "parameter_mmin": 0.0,
           "parameter_shortname": "Decay",
           "parameter_type": 0,
           "parameter_unitstyle": 1
          }
         }
        }
       },
       {
        "box": {
         "id": "obj-26",
         "maxclass": "live.dial",
         "numinlets": 1,
         "numoutlets": 2,
         "patching_rect": [
          220,
          300,
          140,
          22
         ],
         "outlettype": [
          "",
          "float"
         ],
         "presentation": 1,
         "presentation_rect": [
          776.0,
          316.0,
          72.0,
          70.0
         ],
         "varname": "drive",
         "parameter_enable": 1,
         "saved_attribute_attributes": {
          "valueof": {
           "parameter_initial": [
            0.35
           ],
           "parameter_initial_enable": 1,
           "parameter_longname": "Drive",
           "parameter_mmax": 1.0,
           "parameter_mmin": 0.0,
           "parameter_shortname": "Drive",
           "parameter_type": 0,
           "parameter_unitstyle": 1
          }
         }
        }
       },
       {
        "box": {
         "id": "obj-27",
         "maxclass": "live.menu",
         "numinlets": 1,
         "numoutlets": 3,
         "patching_rect": [
          410,
          300,
          140,
          22
         ],
         "outlettype": [
          "",
          "",
          "float"
         ],
         "presentation": 1,
         "presentation_rect": [
          476.0,
          390.0,
          92.0,
          18.0
         ],
         "varname": "mode",
         "parameter_enable": 1,
         "saved_attribute_attributes": {
          "valueof": {
           "parameter_enum": [
            "auto",
            "round",
            "wet",
            "squelch",
            "bite",
            "hollow",
            "rubber",
            "acid"
           ],
           "parameter_initial": [
            0
           ],
           "parameter_initial_enable": 1,
           "parameter_longname": "Mode",
           "parameter_mmax": 7,
           "parameter_shortname": "Mode",
           "parameter_type": 2
          }
         }
        }
       },
       {
        "box": {
         "id": "obj-29",
         "maxclass": "comment",
         "numinlets": 1,
         "numoutlets": 0,
         "patching_rect": [
          790,
          300,
          140,
          22
         ],
         "text": "SHAPE",
         "presentation": 1,
         "presentation_rect": [
          10.0,
          430.0,
          284.0,
          10.0
         ],
         "fontsize": 8.0,
         "textcolor": [
          0.808,
          0.796,
          0.965,
          1.0
         ]
        }
       },
       {
        "box": {
         "id": "obj-30",
         "maxclass": "live.dial",
         "numinlets": 1,
         "numoutlets": 2,
         "patching_rect": [
          980,
          300,
          140,
          22
         ],
         "outlettype": [
          "",
          "float"
         ],
         "presentation": 1,
         "presentation_rect": [
          8.0,
          447.0,
          108.0,
          105.0
         ],
         "varname": "chunk",
         "parameter_enable": 1,
         "saved_attribute_attributes": {
          "valueof": {
           "parameter_initial": [
            0.55
           ],
           "parameter_initial_enable": 1,
           "parameter_longname": "Chunk",
           "parameter_mmax": 1.0,
           "parameter_mmin": 0.0,
           "parameter_shortname": "Chunk",
           "parameter_type": 0,
           "parameter_unitstyle": 1
          }
         }
        }
       },
       {
        "box": {
         "id": "obj-31",
         "maxclass": "live.dial",
         "numinlets": 1,
         "numoutlets": 2,
         "patching_rect": [
          1170,
          300,
          140,
          22
         ],
         "outlettype": [
          "",
          "float"
         ],
         "presentation": 1,
         "presentation_rect": [
          132.0,
          482.0,
          72.0,
          70.0
         ],
         "varname": "wobrate",
         "parameter_enable": 1,
         "saved_attribute_attributes": {
          "valueof": {
           "parameter_initial": [
            0.35
           ],
           "parameter_initial_enable": 1,
           "parameter_longname": "WobRate",
           "parameter_mmax": 1.0,
           "parameter_mmin": 0.0,
           "parameter_shortname": "WobRate",
           "parameter_type": 0,
           "parameter_unitstyle": 1
          }
         }
        }
       },
       {
        "box": {
         "id": "obj-32",
         "maxclass": "live.dial",
         "numinlets": 1,
         "numoutlets": 2,
         "patching_rect": [
          1360,
          300,
          140,
          22
         ],
         "outlettype": [
          "",
          "float"
         ],
         "presentation": 1,
         "presentation_rect": [
          220.0,
          482.0,
          72.0,
          70.0
         ],
         "varname": "wobdepth",
         "parameter_enable": 1,
         "saved_attribute_attributes": {
          "valueof": {
           "parameter_initial": [
            0.0
           ],
           "parameter_initial_enable": 1,
           "parameter_longname": "WobDepth",
           "parameter_mmax": 1.0,
           "parameter_mmin": 0.0,
           "parameter_shortname": "WobDepth",
           "parameter_type": 0,
           "parameter_unitstyle": 1
          }
         }
        }
       },
       {
        "box": {
         "id": "obj-34",
         "maxclass": "comment",
         "numinlets": 1,
         "numoutlets": 0,
         "patching_rect": [
          220,
          390,
          140,
          22
         ],
         "text": "SPACE",
         "presentation": 1,
         "presentation_rect": [
          324.0,
          430.0,
          196.0,
          10.0
         ],
         "fontsize": 8.0,
         "textcolor": [
          0.957,
          0.753,
          0.82,
          1.0
         ]
        }
       },
       {
        "box": {
         "id": "obj-35",
         "maxclass": "live.dial",
         "numinlets": 1,
         "numoutlets": 2,
         "patching_rect": [
          410,
          390,
          140,
          22
         ],
         "outlettype": [
          "",
          "float"
         ],
         "presentation": 1,
         "presentation_rect": [
          322.0,
          447.0,
          108.0,
          105.0
         ],
         "varname": "wet",
         "parameter_enable": 1,
         "saved_attribute_attributes": {
          "valueof": {
           "parameter_initial": [
            0.3
           ],
           "parameter_initial_enable": 1,
           "parameter_longname": "Wet",
           "parameter_mmax": 1.0,
           "parameter_mmin": 0.0,
           "parameter_shortname": "Wet",
           "parameter_type": 0,
           "parameter_unitstyle": 1
          }
         }
        }
       },
       {
        "box": {
         "id": "obj-36",
         "maxclass": "live.dial",
         "numinlets": 1,
         "numoutlets": 2,
         "patching_rect": [
          600,
          390,
          140,
          22
         ],
         "outlettype": [
          "",
          "float"
         ],
         "presentation": 1,
         "presentation_rect": [
          446.0,
          482.0,
          72.0,
          70.0
         ],
         "varname": "width",
         "parameter_enable": 1,
         "saved_attribute_attributes": {
          "valueof": {
           "parameter_initial": [
            0.6
           ],
           "parameter_initial_enable": 1,
           "parameter_longname": "Width",
           "parameter_mmax": 1.0,
           "parameter_mmin": 0.0,
           "parameter_shortname": "Width",
           "parameter_type": 0,
           "parameter_unitstyle": 1
          }
         }
        }
       },
       {
        "box": {
         "id": "obj-38",
         "maxclass": "comment",
         "numinlets": 1,
         "numoutlets": 0,
         "patching_rect": [
          980,
          390,
          140,
          22
         ],
         "text": "CHARACTER",
         "presentation": 1,
         "presentation_rect": [
          550.0,
          430.0,
          108.0,
          10.0
         ],
         "fontsize": 8.0,
         "textcolor": [
          0.827,
          0.82,
          0.78,
          1.0
         ]
        }
       },
       {
        "box": {
         "id": "obj-39",
         "maxclass": "live.dial",
         "numinlets": 1,
         "numoutlets": 2,
         "patching_rect": [
          1170,
          390,
          140,
          22
         ],
         "outlettype": [
          "",
          "float"
         ],
         "presentation": 1,
         "presentation_rect": [
          548.0,
          447.0,
          108.0,
          105.0
         ],
         "varname": "design",
         "parameter_enable": 1,
         "saved_attribute_attributes": {
          "valueof": {
           "parameter_initial": [
            0.5
           ],
           "parameter_initial_enable": 1,
           "parameter_longname": "Design",
           "parameter_mmax": 1.0,
           "parameter_mmin": 0.0,
           "parameter_shortname": "Design",
           "parameter_type": 0,
           "parameter_unitstyle": 1
          }
         }
        }
       },
       {
        "box": {
         "id": "obj-42",
         "maxclass": "newobj",
         "numinlets": 1,
         "numoutlets": 1,
         "patching_rect": [
          220,
          480,
          140,
          22
         ],
         "text": "prepend wave",
         "outlettype": [
          ""
         ]
        }
       },
       {
        "box": {
         "id": "obj-43",
         "maxclass": "newobj",
         "numinlets": 1,
         "numoutlets": 1,
         "patching_rect": [
          410,
          480,
          140,
          22
         ],
         "text": "prepend pw",
         "outlettype": [
          ""
         ]
        }
       },
       {
        "box": {
         "id": "obj-44",
         "maxclass": "newobj",
         "numinlets": 1,
         "numoutlets": 1,
         "patching_rect": [
          600,
          480,
          140,
          22
         ],
         "text": "prepend fold",
         "outlettype": [
          ""
         ]
        }
       },
       {
        "box": {
         "id": "obj-45",
         "maxclass": "newobj",
         "numinlets": 1,
         "numoutlets": 1,
         "patching_rect": [
          790,
          480,
          140,
          22
         ],
         "text": "prepend sub",
         "outlettype": [
          ""
         ]
        }
       },
       {
        "box": {
         "id": "obj-46",
         "maxclass": "newobj",
         "numinlets": 1,
         "numoutlets": 1,
         "patching_rect": [
          980,
          480,
          140,
          22
         ],
         "text": "prepend subsat",
         "outlettype": [
          ""
         ]
        }
       },
       {
        "box": {
         "id": "obj-47",
         "maxclass": "newobj",
         "numinlets": 1,
         "numoutlets": 1,
         "patching_rect": [
          1170,
          480,
          140,
          22
         ],
         "text": "prepend suboct",
         "outlettype": [
          ""
         ]
        }
       },
       {
        "box": {
         "id": "obj-48",
         "maxclass": "newobj",
         "numinlets": 1,
         "numoutlets": 1,
         "patching_rect": [
          1360,
          480,
          140,
          22
         ],
         "text": "prepend squelch",
         "outlettype": [
          ""
         ]
        }
       },
       {
        "box": {
         "id": "obj-49",
         "maxclass": "newobj",
         "numinlets": 1,
         "numoutlets": 1,
         "patching_rect": [
          30,
          570,
          140,
          22
         ],
         "text": "prepend cutoff",
         "outlettype": [
          ""
         ]
        }
       },
       {
        "box": {
         "id": "obj-50",
         "maxclass": "newobj",
         "numinlets": 1,
         "numoutlets": 1,
         "patching_rect": [
          220,
          570,
          140,
          22
         ],
         "text": "prepend decay",
         "outlettype": [
          ""
         ]
        }
       },
       {
        "box": {
         "id": "obj-51",
         "maxclass": "newobj",
         "numinlets": 1,
         "numoutlets": 1,
         "patching_rect": [
          410,
          570,
          140,
          22
         ],
         "text": "prepend drive",
         "outlettype": [
          ""
         ]
        }
       },
       {
        "box": {
         "id": "obj-52",
         "maxclass": "newobj",
         "numinlets": 1,
         "numoutlets": 1,
         "patching_rect": [
          600,
          570,
          140,
          22
         ],
         "text": "prepend fmode",
         "outlettype": [
          ""
         ]
        }
       },
       {
        "box": {
         "id": "obj-53",
         "maxclass": "newobj",
         "numinlets": 1,
         "numoutlets": 1,
         "patching_rect": [
          790,
          570,
          140,
          22
         ],
         "text": "prepend chunk",
         "outlettype": [
          ""
         ]
        }
       },
       {
        "box": {
         "id": "obj-54",
         "maxclass": "newobj",
         "numinlets": 1,
         "numoutlets": 1,
         "patching_rect": [
          980,
          570,
          140,
          22
         ],
         "text": "prepend wobrate",
         "outlettype": [
          ""
         ]
        }
       },
       {
        "box": {
         "id": "obj-55",
         "maxclass": "newobj",
         "numinlets": 1,
         "numoutlets": 1,
         "patching_rect": [
          1170,
          570,
          140,
          22
         ],
         "text": "prepend wobdepth",
         "outlettype": [
          ""
         ]
        }
       },
       {
        "box": {
         "id": "obj-56",
         "maxclass": "newobj",
         "numinlets": 1,
         "numoutlets": 1,
         "patching_rect": [
          1360,
          570,
          140,
          22
         ],
         "text": "prepend wet",
         "outlettype": [
          ""
         ]
        }
       },
       {
        "box": {
         "id": "obj-57",
         "maxclass": "newobj",
         "numinlets": 1,
         "numoutlets": 1,
         "patching_rect": [
          30,
          660,
          140,
          22
         ],
         "text": "prepend width",
         "outlettype": [
          ""
         ]
        }
       },
       {
        "box": {
         "id": "obj-58",
         "maxclass": "newobj",
         "numinlets": 1,
         "numoutlets": 1,
         "patching_rect": [
          220,
          660,
          140,
          22
         ],
         "text": "prepend design",
         "outlettype": [
          ""
         ]
        }
       },
       {
        "box": {
         "id": "obj-59",
         "maxclass": "newobj",
         "text": "p comp_window",
         "numinlets": 1,
         "numoutlets": 1,
         "patching_rect": [
          410,
          660,
          140,
          22
         ],
         "patcher": {
          "fileversion": 1,
          "appversion": {
           "major": 8,
           "minor": 6,
           "revision": 0,
           "architecture": "x64",
           "modernui": 1
          },
          "classnamespace": "box",
          "rect": [
           160.0,
           100.0,
           980.0,
           300.0
          ],
          "bglocked": 0,
          "openinpresentation": 1,
          "default_fontsize": 10.0,
          "default_fontface": 0,
          "default_fontname": "Arial Bold",
          "gridonopen": 1,
          "gridsize": [
           8.0,
           8.0
          ],
          "gridsnaponopen": 1,
          "objectsnaponopen": 1,
          "statusbarvisible": 2,
          "toolbarvisible": 1,
          "lefttoolbarpinned": 0,
          "toptoolbarpinned": 0,
          "righttoolbarpinned": 0,
          "bottomtoolbarpinned": 0,
          "toolbars_unpinned_last_save": 0,
          "tallnewobj": 0,
          "boxanimatetime": 500,
          "enablehscroll": 1,
          "enablevscroll": 1,
          "devicewidth": 0.0,
          "description": "",
          "digest": "",
          "tags": "",
          "style": "",
          "subpatcher_template": "",
          "assistshowspatchername": 0,
          "parameters": {
           "obj-8": [
            "Novelty",
            "Novelty",
            0
           ],
           "obj-9": [
            "Density",
            "Density",
            0
           ],
           "obj-10": [
            "Interlock",
            "Interlock",
            0
           ],
           "obj-11": [
            "Groove",
            "Groove",
            0
           ],
           "obj-12": [
            "Root",
            "Root",
            0
           ],
           "obj-13": [
            "Length",
            "Length",
            0
           ],
           "obj-16": [
            "Lock",
            "Lock",
            0
           ],
           "obj-18": [
            "FrzRhythm",
            "FrzRhythm",
            0
           ],
           "obj-20": [
            "FrzPitch",
            "FrzPitch",
            0
           ],
           "obj-22": [
            "FrzTimbre",
            "FrzTimbre",
            0
           ],
           "parameterbanks": {
            "0": {
             "index": 0,
             "name": "",
             "parameters": [
              "Novelty",
              "Density",
              "Interlock",
              "Groove",
              "Root",
              "Length",
              "Lock",
              "FrzRhythm"
             ]
            },
            "1": {
             "index": 1,
             "name": "",
             "parameters": [
              "FrzPitch",
              "FrzTimbre",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-"
             ]
            }
           },
           "inherited_shortname": 1
          },
          "dependency_cache": [],
          "latency": 0,
          "is_mpe": 0,
          "minimum_live_version": "",
          "minimum_max_version": "",
          "platform_compatibility": 0,
          "autosave": 0,
          "boxes": [
           {
            "box": {
             "id": "obj-2",
             "maxclass": "inlet",
             "numinlets": 0,
             "numoutlets": 1,
             "patching_rect": [
              20.0,
              20.0,
              30.0,
              30.0
             ],
             "outlettype": [
              ""
             ],
             "comment": "pcontrol target"
            }
           },
           {
            "box": {
             "id": "obj-3",
             "maxclass": "outlet",
             "numinlets": 1,
             "numoutlets": 0,
             "patching_rect": [
              60.0,
              20.0,
              30.0,
              30.0
             ],
             "comment": "control messages out"
            }
           },
           {
            "box": {
             "id": "obj-4",
             "maxclass": "comment",
             "numinlets": 1,
             "numoutlets": 0,
             "patching_rect": [
              600,
              30,
              140,
              22
             ],
             "text": "COMPOSE",
             "presentation": 1,
             "presentation_rect": [
              8.0,
              8.0,
              400.0,
              20.0
             ],
             "fontface": 1,
             "fontsize": 15.0,
             "textcolor": [
              0.92,
              0.92,
              0.92,
              1.0
             ]
            }
           },
           {
            "box": {
             "id": "obj-5",
             "maxclass": "comment",
             "numinlets": 1,
             "numoutlets": 0,
             "patching_rect": [
              790,
              30,
              140,
              22
             ],
             "text": "what gets played \u2014 set once, then left alone",
             "presentation": 1,
             "presentation_rect": [
              8.0,
              27.0,
              480.0,
              14.0
             ],
             "fontsize": 10.0,
             "textcolor": [
              0.55,
              0.55,
              0.55,
              1.0
             ]
            }
           },
           {
            "box": {
             "id": "obj-7",
             "maxclass": "comment",
             "numinlets": 1,
             "numoutlets": 0,
             "patching_rect": [
              1170,
              30,
              140,
              22
             ],
             "text": "PHRASE",
             "presentation": 1,
             "presentation_rect": [
              10.0,
              48.0,
              248.0,
              10.0
             ],
             "fontsize": 8.0,
             "textcolor": [
              0.827,
              0.82,
              0.78,
              1.0
             ]
            }
           },
           {
            "box": {
             "id": "obj-8",
             "maxclass": "live.dial",
             "numinlets": 1,
             "numoutlets": 2,
             "patching_rect": [
              1360,
              30,
              140,
              22
             ],
             "outlettype": [
              "",
              "float"
             ],
             "presentation": 1,
             "presentation_rect": [
              8.0,
              66.0,
              60.0,
              58.0
             ],
             "varname": "novelty",
             "parameter_enable": 1,
             "saved_attribute_attributes": {
              "valueof": {
               "parameter_initial": [
                0.45
               ],
               "parameter_initial_enable": 1,
               "parameter_longname": "Novelty",
               "parameter_mmax": 1.0,
               "parameter_mmin": 0.0,
               "parameter_shortname": "Novelty",
               "parameter_type": 0,
               "parameter_unitstyle": 1
              }
             }
            }
           },
           {
            "box": {
             "id": "obj-9",
             "maxclass": "live.dial",
             "numinlets": 1,
             "numoutlets": 2,
             "patching_rect": [
              30,
              120,
              140,
              22
             ],
             "outlettype": [
              "",
              "float"
             ],
             "presentation": 1,
             "presentation_rect": [
              80.0,
              66.0,
              60.0,
              58.0
             ],
             "varname": "density",
             "parameter_enable": 1,
             "saved_attribute_attributes": {
              "valueof": {
               "parameter_initial": [
                0.5
               ],
               "parameter_initial_enable": 1,
               "parameter_longname": "Density",
               "parameter_mmax": 1.0,
               "parameter_mmin": 0.0,
               "parameter_shortname": "Density",
               "parameter_type": 0,
               "parameter_unitstyle": 1
              }
             }
            }
           },
           {
            "box": {
             "id": "obj-10",
             "maxclass": "live.dial",
             "numinlets": 1,
             "numoutlets": 2,
             "patching_rect": [
              220,
              120,
              140,
              22
             ],
             "outlettype": [
              "",
              "float"
             ],
             "presentation": 1,
             "presentation_rect": [
              152.0,
              66.0,
              60.0,
              58.0
             ],
             "varname": "interlock",
             "parameter_enable": 1,
             "saved_attribute_attributes": {
              "valueof": {
               "parameter_initial": [
                0.5
               ],
               "parameter_initial_enable": 1,
               "parameter_longname": "Interlock",
               "parameter_mmax": 1.0,
               "parameter_mmin": 0.0,
               "parameter_shortname": "Interlock",
               "parameter_type": 0,
               "parameter_unitstyle": 1
              }
             }
            }
           },
           {
            "box": {
             "id": "obj-11",
             "maxclass": "live.menu",
             "numinlets": 1,
             "numoutlets": 3,
             "patching_rect": [
              410,
              120,
              140,
              22
             ],
             "outlettype": [
              "",
              "",
              "float"
             ],
             "presentation": 1,
             "presentation_rect": [
              8.0,
              128.0,
              112.0,
              18.0
             ],
             "varname": "groove",
             "parameter_enable": 1,
             "saved_attribute_attributes": {
              "valueof": {
               "parameter_enum": [
                "restrained",
                "rolling",
                "syncopated",
                "driving",
                "acidic",
                "broken",
                "hypnotic"
               ],
               "parameter_initial": [
                1
               ],
               "parameter_initial_enable": 1,
               "parameter_longname": "Groove",
               "parameter_mmax": 6,
               "parameter_shortname": "Groove",
               "parameter_type": 2
              }
             }
            }
           },
           {
            "box": {
             "id": "obj-12",
             "maxclass": "live.menu",
             "numinlets": 1,
             "numoutlets": 3,
             "patching_rect": [
              600,
              120,
              140,
              22
             ],
             "outlettype": [
              "",
              "",
              "float"
             ],
             "presentation": 1,
             "presentation_rect": [
              124.0,
              128.0,
              58.0,
              18.0
             ],
             "varname": "root",
             "parameter_enable": 1,
             "saved_attribute_attributes": {
              "valueof": {
               "parameter_enum": [
                "C",
                "Db",
                "D",
                "Eb",
                "E",
                "F",
                "Gb",
                "G",
                "Ab",
                "A",
                "Bb",
                "B"
               ],
               "parameter_initial": [
                0
               ],
               "parameter_initial_enable": 1,
               "parameter_longname": "Root",
               "parameter_mmax": 11,
               "parameter_shortname": "Root",
               "parameter_type": 2
              }
             }
            }
           },
           {
            "box": {
             "id": "obj-13",
             "maxclass": "live.menu",
             "numinlets": 1,
             "numoutlets": 3,
             "patching_rect": [
              790,
              120,
              140,
              22
             ],
             "outlettype": [
              "",
              "",
              "float"
             ],
             "presentation": 1,
             "presentation_rect": [
              186.0,
              128.0,
              70.0,
              18.0
             ],
             "varname": "length",
             "parameter_enable": 1,
             "saved_attribute_attributes": {
              "valueof": {
               "parameter_enum": [
                "1 bar",
                "2 bars",
                "4 bars"
               ],
               "parameter_initial": [
                1
               ],
               "parameter_initial_enable": 1,
               "parameter_longname": "Length",
               "parameter_mmax": 2,
               "parameter_shortname": "Length",
               "parameter_type": 2
              }
             }
            }
           },
           {
            "box": {
             "id": "obj-15",
             "maxclass": "comment",
             "numinlets": 1,
             "numoutlets": 0,
             "patching_rect": [
              1170,
              120,
              140,
              22
             ],
             "text": "FREEZE",
             "presentation": 1,
             "presentation_rect": [
              10.0,
              180.0,
              185.0,
              10.0
             ],
             "fontsize": 8.0,
             "textcolor": [
              0.957,
              0.753,
              0.82,
              1.0
             ]
            }
           },
           {
            "box": {
             "id": "obj-16",
             "maxclass": "live.toggle",
             "numinlets": 1,
             "numoutlets": 2,
             "patching_rect": [
              1360,
              120,
              140,
              22
             ],
             "outlettype": [
              "",
              "float"
             ],
             "presentation": 1,
             "presentation_rect": [
              8.0,
              196.0,
              15.0,
              20.0
             ],
             "varname": "lock",
             "parameter_enable": 1,
             "saved_attribute_attributes": {
              "valueof": {
               "parameter_enum": [
                "off",
                "on"
               ],
               "parameter_initial": [
                0
               ],
               "parameter_initial_enable": 1,
               "parameter_longname": "Lock",
               "parameter_mmax": 1,
               "parameter_shortname": "Lock",
               "parameter_type": 2
              }
             }
            }
           },
           {
            "box": {
             "id": "obj-17",
             "maxclass": "comment",
             "numinlets": 1,
             "numoutlets": 0,
             "patching_rect": [
              30,
              210,
              140,
              22
             ],
             "text": "lock",
             "presentation": 1,
             "presentation_rect": [
              25.0,
              196.0,
              30.0,
              16.0
             ],
             "fontsize": 9.0
            }
           },
           {
            "box": {
             "id": "obj-18",
             "maxclass": "live.toggle",
             "numinlets": 1,
             "numoutlets": 2,
             "patching_rect": [
              220,
              210,
              140,
              22
             ],
             "outlettype": [
              "",
              "float"
             ],
             "presentation": 1,
             "presentation_rect": [
              58.0,
              196.0,
              15.0,
              20.0
             ],
             "varname": "frzrhythm",
             "parameter_enable": 1,
             "saved_attribute_attributes": {
              "valueof": {
               "parameter_enum": [
                "off",
                "on"
               ],
               "parameter_initial": [
                0
               ],
               "parameter_initial_enable": 1,
               "parameter_longname": "FrzRhythm",
               "parameter_mmax": 1,
               "parameter_shortname": "FrzRhythm",
               "parameter_type": 2
              }
             }
            }
           },
           {
            "box": {
             "id": "obj-19",
             "maxclass": "comment",
             "numinlets": 1,
             "numoutlets": 0,
             "patching_rect": [
              410,
              210,
              140,
              22
             ],
             "text": "rhy",
             "presentation": 1,
             "presentation_rect": [
              75.0,
              196.0,
              26.0,
              16.0
             ],
             "fontsize": 9.0
            }
           },
           {
            "box": {
             "id": "obj-20",
             "maxclass": "live.toggle",
             "numinlets": 1,
             "numoutlets": 2,
             "patching_rect": [
              600,
              210,
              140,
              22
             ],
             "outlettype": [
              "",
              "float"
             ],
             "presentation": 1,
             "presentation_rect": [
              104.0,
              196.0,
              15.0,
              20.0
             ],
             "varname": "frzpitch",
             "parameter_enable": 1,
             "saved_attribute_attributes": {
              "valueof": {
               "parameter_enum": [
                "off",
                "on"
               ],
               "parameter_initial": [
                0
               ],
               "parameter_initial_enable": 1,
               "parameter_longname": "FrzPitch",
               "parameter_mmax": 1,
               "parameter_shortname": "FrzPitch",
               "parameter_type": 2
              }
             }
            }
           },
           {
            "box": {
             "id": "obj-21",
             "maxclass": "comment",
             "numinlets": 1,
             "numoutlets": 0,
             "patching_rect": [
              790,
              210,
              140,
              22
             ],
             "text": "pit",
             "presentation": 1,
             "presentation_rect": [
              121.0,
              196.0,
              26.0,
              16.0
             ],
             "fontsize": 9.0
            }
           },
           {
            "box": {
             "id": "obj-22",
             "maxclass": "live.toggle",
             "numinlets": 1,
             "numoutlets": 2,
             "patching_rect": [
              980,
              210,
              140,
              22
             ],
             "outlettype": [
              "",
              "float"
             ],
             "presentation": 1,
             "presentation_rect": [
              150.0,
              196.0,
              15.0,
              20.0
             ],
             "varname": "frztimbre",
             "parameter_enable": 1,
             "saved_attribute_attributes": {
              "valueof": {
               "parameter_enum": [
                "off",
                "on"
               ],
               "parameter_initial": [
                0
               ],
               "parameter_initial_enable": 1,
               "parameter_longname": "FrzTimbre",
               "parameter_mmax": 1,
               "parameter_shortname": "FrzTimbre",
               "parameter_type": 2
              }
             }
            }
           },
           {
            "box": {
             "id": "obj-23",
             "maxclass": "comment",
             "numinlets": 1,
             "numoutlets": 0,
             "patching_rect": [
              1170,
              210,
              140,
              22
             ],
             "text": "tim",
             "presentation": 1,
             "presentation_rect": [
              167.0,
              196.0,
              26.0,
              16.0
             ],
             "fontsize": 9.0
            }
           },
           {
            "box": {
             "id": "obj-25",
             "maxclass": "comment",
             "numinlets": 1,
             "numoutlets": 0,
             "patching_rect": [
              30,
              300,
              140,
              22
             ],
             "text": "GENERATE",
             "presentation": 1,
             "presentation_rect": [
              219.0,
              180.0,
              170.0,
              10.0
             ],
             "fontsize": 8.0,
             "textcolor": [
              0.624,
              0.882,
              0.796,
              1.0
             ]
            }
           },
           {
            "box": {
             "id": "obj-26",
             "maxclass": "message",
             "numinlets": 2,
             "numoutlets": 1,
             "patching_rect": [
              220,
              300,
              140,
              22
             ],
             "text": "Mutate",
             "outlettype": [
              ""
             ],
             "presentation": 1,
             "presentation_rect": [
              217.0,
              196.0,
              54.0,
              20.0
             ],
             "fontsize": 9.0
            }
           },
           {
            "box": {
             "id": "obj-27",
             "maxclass": "message",
             "numinlets": 2,
             "numoutlets": 1,
             "patching_rect": [
              410,
              300,
              140,
              22
             ],
             "text": "Return",
             "outlettype": [
              ""
             ],
             "presentation": 1,
             "presentation_rect": [
              275.0,
              196.0,
              54.0,
              20.0
             ],
             "fontsize": 9.0
            }
           },
           {
            "box": {
             "id": "obj-28",
             "maxclass": "message",
             "numinlets": 2,
             "numoutlets": 1,
             "patching_rect": [
              600,
              300,
              140,
              22
             ],
             "text": "Reseed",
             "outlettype": [
              ""
             ],
             "presentation": 1,
             "presentation_rect": [
              333.0,
              196.0,
              54.0,
              20.0
             ],
             "fontsize": 9.0
            }
           },
           {
            "box": {
             "id": "obj-30",
             "maxclass": "comment",
             "numinlets": 1,
             "numoutlets": 0,
             "patching_rect": [
              980,
              300,
              140,
              22
             ],
             "text": "REGENERATE LAYER",
             "presentation": 1,
             "presentation_rect": [
              413.0,
              180.0,
              286.0,
              10.0
             ],
             "fontsize": 8.0,
             "textcolor": [
              0.961,
              0.769,
              0.702,
              1.0
             ]
            }
           },
           {
            "box": {
             "id": "obj-31",
             "maxclass": "message",
             "numinlets": 2,
             "numoutlets": 1,
             "patching_rect": [
              1170,
              300,
              140,
              22
             ],
             "text": "Rhythm",
             "outlettype": [
              ""
             ],
             "presentation": 1,
             "presentation_rect": [
              411.0,
              196.0,
              54.0,
              20.0
             ],
             "fontsize": 9.0
            }
           },
           {
            "box": {
             "id": "obj-32",
             "maxclass": "message",
             "numinlets": 2,
             "numoutlets": 1,
             "patching_rect": [
              1360,
              300,
              140,
              22
             ],
             "text": "Pitch",
             "outlettype": [
              ""
             ],
             "presentation": 1,
             "presentation_rect": [
              469.0,
              196.0,
              54.0,
              20.0
             ],
             "fontsize": 9.0
            }
           },
           {
            "box": {
             "id": "obj-33",
             "maxclass": "message",
             "numinlets": 2,
             "numoutlets": 1,
             "patching_rect": [
              30,
              390,
              140,
              22
             ],
             "text": "Accent",
             "outlettype": [
              ""
             ],
             "presentation": 1,
             "presentation_rect": [
              527.0,
              196.0,
              54.0,
              20.0
             ],
             "fontsize": 9.0
            }
           },
           {
            "box": {
             "id": "obj-34",
             "maxclass": "message",
             "numinlets": 2,
             "numoutlets": 1,
             "patching_rect": [
              220,
              390,
              140,
              22
             ],
             "text": "Slide",
             "outlettype": [
              ""
             ],
             "presentation": 1,
             "presentation_rect": [
              585.0,
              196.0,
              54.0,
              20.0
             ],
             "fontsize": 9.0
            }
           },
           {
            "box": {
             "id": "obj-35",
             "maxclass": "message",
             "numinlets": 2,
             "numoutlets": 1,
             "patching_rect": [
              410,
              390,
              140,
              22
             ],
             "text": "Sound",
             "outlettype": [
              ""
             ],
             "presentation": 1,
             "presentation_rect": [
              643.0,
              196.0,
              54.0,
              20.0
             ],
             "fontsize": 9.0
            }
           },
           {
            "box": {
             "id": "obj-37",
             "maxclass": "comment",
             "numinlets": 1,
             "numoutlets": 0,
             "patching_rect": [
              790,
              390,
              140,
              22
             ],
             "text": "UTILITY",
             "presentation": 1,
             "presentation_rect": [
              723.0,
              180.0,
              54.0,
              10.0
             ],
             "fontsize": 8.0,
             "textcolor": [
              0.827,
              0.82,
              0.78,
              1.0
             ]
            }
           },
           {
            "box": {
             "id": "obj-38",
             "maxclass": "message",
             "numinlets": 2,
             "numoutlets": 1,
             "patching_rect": [
              980,
              390,
              140,
              22
             ],
             "text": "Capture",
             "outlettype": [
              ""
             ],
             "presentation": 1,
             "presentation_rect": [
              721.0,
              196.0,
              54.0,
              20.0
             ],
             "fontsize": 9.0
            }
           },
           {
            "box": {
             "id": "obj-39",
             "maxclass": "newobj",
             "numinlets": 1,
             "numoutlets": 1,
             "patching_rect": [
              1170,
              390,
              140,
              22
             ],
             "text": "prepend novelty",
             "outlettype": [
              ""
             ]
            }
           },
           {
            "box": {
             "id": "obj-40",
             "maxclass": "newobj",
             "numinlets": 1,
             "numoutlets": 1,
             "patching_rect": [
              1360,
              390,
              140,
              22
             ],
             "text": "prepend density",
             "outlettype": [
              ""
             ]
            }
           },
           {
            "box": {
             "id": "obj-41",
             "maxclass": "newobj",
             "numinlets": 1,
             "numoutlets": 1,
             "patching_rect": [
              30,
              480,
              140,
              22
             ],
             "text": "prepend interlock",
             "outlettype": [
              ""
             ]
            }
           },
           {
            "box": {
             "id": "obj-42",
             "maxclass": "newobj",
             "numinlets": 1,
             "numoutlets": 1,
             "patching_rect": [
              220,
              480,
              140,
              22
             ],
             "text": "prepend groove",
             "outlettype": [
              ""
             ]
            }
           },
           {
            "box": {
             "id": "obj-43",
             "maxclass": "newobj",
             "numinlets": 1,
             "numoutlets": 1,
             "patching_rect": [
              410,
              480,
              140,
              22
             ],
             "text": "prepend root",
             "outlettype": [
              ""
             ]
            }
           },
           {
            "box": {
             "id": "obj-44",
             "maxclass": "newobj",
             "numinlets": 1,
             "numoutlets": 1,
             "patching_rect": [
              600,
              480,
              140,
              22
             ],
             "text": "prepend plen",
             "outlettype": [
              ""
             ]
            }
           },
           {
            "box": {
             "id": "obj-45",
             "maxclass": "newobj",
             "numinlets": 1,
             "numoutlets": 1,
             "patching_rect": [
              790,
              480,
              140,
              22
             ],
             "text": "prepend lock",
             "outlettype": [
              ""
             ]
            }
           },
           {
            "box": {
             "id": "obj-46",
             "maxclass": "newobj",
             "numinlets": 1,
             "numoutlets": 1,
             "patching_rect": [
              980,
              480,
              140,
              22
             ],
             "text": "prepend frzr",
             "outlettype": [
              ""
             ]
            }
           },
           {
            "box": {
             "id": "obj-47",
             "maxclass": "newobj",
             "numinlets": 1,
             "numoutlets": 1,
             "patching_rect": [
              1170,
              480,
              140,
              22
             ],
             "text": "prepend frzp",
             "outlettype": [
              ""
             ]
            }
           },
           {
            "box": {
             "id": "obj-48",
             "maxclass": "newobj",
             "numinlets": 1,
             "numoutlets": 1,
             "patching_rect": [
              1360,
              480,
              140,
              22
             ],
             "text": "prepend frzt",
             "outlettype": [
              ""
             ]
            }
           },
           {
            "box": {
             "id": "obj-50",
             "maxclass": "comment",
             "numinlets": 1,
             "numoutlets": 0,
             "patching_rect": [
              220,
              570,
              140,
              22
             ],
             "text": "PAGE",
             "presentation": 1,
             "presentation_rect": [
              838.0,
              48.0,
              110.0,
              10.0
             ],
             "fontsize": 8.0,
             "textcolor": [
              0.624,
              0.882,
              0.796,
              1.0
             ]
            }
           },
           {
            "box": {
             "id": "obj-51",
             "maxclass": "message",
             "numinlets": 2,
             "numoutlets": 1,
             "patching_rect": [
              410,
              570,
              140,
              22
             ],
             "text": "Sculpt",
             "outlettype": [
              ""
             ],
             "presentation": 1,
             "presentation_rect": [
              842.0,
              78.0,
              98.0,
              24.0
             ],
             "fontsize": 11.0
            }
           },
           {
            "box": {
             "id": "obj-52",
             "maxclass": "comment",
             "numinlets": 1,
             "numoutlets": 0,
             "patching_rect": [
              600,
              570,
              140,
              22
             ],
             "text": "back to the voice",
             "presentation": 1,
             "presentation_rect": [
              842.0,
              108.0,
              104.0,
              26.0
             ],
             "fontsize": 9.0,
             "textcolor": [
              0.55,
              0.55,
              0.55,
              1.0
             ]
            }
           },
           {
            "box": {
             "id": "obj-53",
             "maxclass": "message",
             "numinlets": 2,
             "numoutlets": 1,
             "patching_rect": [
              790,
              570,
              140,
              22
             ],
             "text": "wclose",
             "outlettype": [
              ""
             ]
            }
           },
           {
            "box": {
             "id": "obj-54",
             "maxclass": "newobj",
             "numinlets": 1,
             "numoutlets": 1,
             "patching_rect": [
              980,
              570,
              140,
              22
             ],
             "text": "thispatcher",
             "outlettype": [
              ""
             ]
            }
           },
           {
            "box": {
             "id": "obj-49",
             "maxclass": "panel",
             "numinlets": 1,
             "numoutlets": 0,
             "patching_rect": [
              30,
              570,
              140,
              22
             ],
             "presentation": 1,
             "presentation_rect": [
              830.0,
              46.0,
              122.0,
              124.0
             ],
             "bgcolor": [
              0.031,
              0.314,
              0.255,
              0.22
             ],
             "bordercolor": [
              0.059,
              0.431,
              0.337,
              0.5
             ],
             "rounded": 8,
             "border": 1
            }
           },
           {
            "box": {
             "id": "obj-36",
             "maxclass": "panel",
             "numinlets": 1,
             "numoutlets": 0,
             "patching_rect": [
              600,
              390,
              140,
              22
             ],
             "presentation": 1,
             "presentation_rect": [
              715.0,
              178.0,
              66.0,
              40.0
             ],
             "bgcolor": [
              0.267,
              0.267,
              0.255,
              0.22
             ],
             "bordercolor": [
              0.373,
              0.369,
              0.353,
              0.5
             ],
             "rounded": 8,
             "border": 1
            }
           },
           {
            "box": {
             "id": "obj-29",
             "maxclass": "panel",
             "numinlets": 1,
             "numoutlets": 0,
             "patching_rect": [
              790,
              300,
              140,
              22
             ],
             "presentation": 1,
             "presentation_rect": [
              405.0,
              178.0,
              298.0,
              40.0
             ],
             "bgcolor": [
              0.443,
              0.169,
              0.075,
              0.22
             ],
             "bordercolor": [
              0.6,
              0.235,
              0.114,
              0.5
             ],
             "rounded": 8,
             "border": 1
            }
           },
           {
            "box": {
             "id": "obj-24",
             "maxclass": "panel",
             "numinlets": 1,
             "numoutlets": 0,
             "patching_rect": [
              1360,
              210,
              140,
              22
             ],
             "presentation": 1,
             "presentation_rect": [
              211.0,
              178.0,
              182.0,
              40.0
             ],
             "bgcolor": [
              0.031,
              0.314,
              0.255,
              0.22
             ],
             "bordercolor": [
              0.059,
              0.431,
              0.337,
              0.5
             ],
             "rounded": 8,
             "border": 1
            }
           },
           {
            "box": {
             "id": "obj-14",
             "maxclass": "panel",
             "numinlets": 1,
             "numoutlets": 0,
             "patching_rect": [
              980,
              120,
              140,
              22
             ],
             "presentation": 1,
             "presentation_rect": [
              2.0,
              178.0,
              197.0,
              40.0
             ],
             "bgcolor": [
              0.447,
              0.141,
              0.243,
              0.22
             ],
             "bordercolor": [
              0.6,
              0.208,
              0.337,
              0.5
             ],
             "rounded": 8,
             "border": 1
            }
           },
           {
            "box": {
             "id": "obj-6",
             "maxclass": "panel",
             "numinlets": 1,
             "numoutlets": 0,
             "patching_rect": [
              980,
              30,
              140,
              22
             ],
             "presentation": 1,
             "presentation_rect": [
              2.0,
              46.0,
              260.0,
              124.0
             ],
             "bgcolor": [
              0.267,
              0.267,
              0.255,
              0.22
             ],
             "bordercolor": [
              0.373,
              0.369,
              0.353,
              0.5
             ],
             "rounded": 8,
             "border": 1
            }
           },
           {
            "box": {
             "id": "obj-1",
             "maxclass": "panel",
             "numinlets": 1,
             "numoutlets": 0,
             "patching_rect": [
              30,
              30,
              140,
              22
             ],
             "presentation": 1,
             "presentation_rect": [
              0.0,
              0.0,
              980.0,
              300.0
             ],
             "bgcolor": [
              0.086,
              0.086,
              0.094,
              1.0
             ],
             "bordercolor": [
              0.086,
              0.086,
              0.094,
              1.0
             ],
             "rounded": 0,
             "border": 1
            }
           }
          ],
          "lines": [
           {
            "patchline": {
             "source": [
              "obj-8",
              0
             ],
             "destination": [
              "obj-39",
              0
             ]
            }
           },
           {
            "patchline": {
             "source": [
              "obj-39",
              0
             ],
             "destination": [
              "obj-3",
              0
             ]
            }
           },
           {
            "patchline": {
             "source": [
              "obj-9",
              0
             ],
             "destination": [
              "obj-40",
              0
             ]
            }
           },
           {
            "patchline": {
             "source": [
              "obj-40",
              0
             ],
             "destination": [
              "obj-3",
              0
             ]
            }
           },
           {
            "patchline": {
             "source": [
              "obj-10",
              0
             ],
             "destination": [
              "obj-41",
              0
             ]
            }
           },
           {
            "patchline": {
             "source": [
              "obj-41",
              0
             ],
             "destination": [
              "obj-3",
              0
             ]
            }
           },
           {
            "patchline": {
             "source": [
              "obj-11",
              0
             ],
             "destination": [
              "obj-42",
              0
             ]
            }
           },
           {
            "patchline": {
             "source": [
              "obj-42",
              0
             ],
             "destination": [
              "obj-3",
              0
             ]
            }
           },
           {
            "patchline": {
             "source": [
              "obj-12",
              0
             ],
             "destination": [
              "obj-43",
              0
             ]
            }
           },
           {
            "patchline": {
             "source": [
              "obj-43",
              0
             ],
             "destination": [
              "obj-3",
              0
             ]
            }
           },
           {
            "patchline": {
             "source": [
              "obj-13",
              0
             ],
             "destination": [
              "obj-44",
              0
             ]
            }
           },
           {
            "patchline": {
             "source": [
              "obj-44",
              0
             ],
             "destination": [
              "obj-3",
              0
             ]
            }
           },
           {
            "patchline": {
             "source": [
              "obj-16",
              0
             ],
             "destination": [
              "obj-45",
              0
             ]
            }
           },
           {
            "patchline": {
             "source": [
              "obj-45",
              0
             ],
             "destination": [
              "obj-3",
              0
             ]
            }
           },
           {
            "patchline": {
             "source": [
              "obj-18",
              0
             ],
             "destination": [
              "obj-46",
              0
             ]
            }
           },
           {
            "patchline": {
             "source": [
              "obj-46",
              0
             ],
             "destination": [
              "obj-3",
              0
             ]
            }
           },
           {
            "patchline": {
             "source": [
              "obj-20",
              0
             ],
             "destination": [
              "obj-47",
              0
             ]
            }
           },
           {
            "patchline": {
             "source": [
              "obj-47",
              0
             ],
             "destination": [
              "obj-3",
              0
             ]
            }
           },
           {
            "patchline": {
             "source": [
              "obj-22",
              0
             ],
             "destination": [
              "obj-48",
              0
             ]
            }
           },
           {
            "patchline": {
             "source": [
              "obj-48",
              0
             ],
             "destination": [
              "obj-3",
              0
             ]
            }
           },
           {
            "patchline": {
             "source": [
              "obj-26",
              0
             ],
             "destination": [
              "obj-3",
              0
             ]
            }
           },
           {
            "patchline": {
             "source": [
              "obj-27",
              0
             ],
             "destination": [
              "obj-3",
              0
             ]
            }
           },
           {
            "patchline": {
             "source": [
              "obj-28",
              0
             ],
             "destination": [
              "obj-3",
              0
             ]
            }
           },
           {
            "patchline": {
             "source": [
              "obj-31",
              0
             ],
             "destination": [
              "obj-3",
              0
             ]
            }
           },
           {
            "patchline": {
             "source": [
              "obj-32",
              0
             ],
             "destination": [
              "obj-3",
              0
             ]
            }
           },
           {
            "patchline": {
             "source": [
              "obj-33",
              0
             ],
             "destination": [
              "obj-3",
              0
             ]
            }
           },
           {
            "patchline": {
             "source": [
              "obj-34",
              0
             ],
             "destination": [
              "obj-3",
              0
             ]
            }
           },
           {
            "patchline": {
             "source": [
              "obj-35",
              0
             ],
             "destination": [
              "obj-3",
              0
             ]
            }
           },
           {
            "patchline": {
             "source": [
              "obj-38",
              0
             ],
             "destination": [
              "obj-3",
              0
             ]
            }
           },
           {
            "patchline": {
             "source": [
              "obj-51",
              0
             ],
             "destination": [
              "obj-53",
              0
             ]
            }
           },
           {
            "patchline": {
             "source": [
              "obj-53",
              0
             ],
             "destination": [
              "obj-54",
              0
             ]
            }
           }
          ],
          "title": "PG Bass Generator \u2014 Compose"
         },
         "saved_object_attributes": {
          "description": "",
          "digest": "",
          "globalpatchername": "",
          "tags": ""
         },
         "varname": "comp_window",
         "outlettype": [
          ""
         ]
        }
       },
       {
        "box": {
         "id": "obj-60",
         "maxclass": "newobj",
         "numinlets": 1,
         "numoutlets": 1,
         "patching_rect": [
          600,
          660,
          140,
          22
         ],
         "text": "pcontrol",
         "outlettype": [
          ""
         ]
        }
       },
       {
        "box": {
         "id": "obj-62",
         "maxclass": "comment",
         "numinlets": 1,
         "numoutlets": 0,
         "patching_rect": [
          980,
          660,
          140,
          22
         ],
         "text": "PAGE",
         "presentation": 1,
         "presentation_rect": [
          700.0,
          430.0,
          248.0,
          10.0
         ],
         "fontsize": 8.0,
         "textcolor": [
          0.624,
          0.882,
          0.796,
          1.0
         ]
        }
       },
       {
        "box": {
         "id": "obj-63",
         "maxclass": "message",
         "numinlets": 2,
         "numoutlets": 1,
         "patching_rect": [
          1170,
          660,
          140,
          22
         ],
         "text": "Compose",
         "outlettype": [
          ""
         ],
         "presentation": 1,
         "presentation_rect": [
          704.0,
          462.0,
          110.0,
          24.0
         ],
         "fontsize": 11.0
        }
       },
       {
        "box": {
         "id": "obj-64",
         "maxclass": "comment",
         "numinlets": 1,
         "numoutlets": 0,
         "patching_rect": [
          1360,
          660,
          140,
          22
         ],
         "text": "groove \u00b7 root \u00b7 length \u00b7 interlock \u00b7 freeze \u00b7 reroll",
         "presentation": 1,
         "presentation_rect": [
          704.0,
          494.0,
          236.0,
          26.0
         ],
         "fontsize": 9.0,
         "textcolor": [
          0.55,
          0.55,
          0.55,
          1.0
         ]
        }
       },
       {
        "box": {
         "id": "obj-65",
         "maxclass": "message",
         "numinlets": 2,
         "numoutlets": 1,
         "patching_rect": [
          30,
          750,
          140,
          22
         ],
         "text": "open",
         "outlettype": [
          ""
         ]
        }
       },
       {
        "box": {
         "id": "obj-61",
         "maxclass": "panel",
         "numinlets": 1,
         "numoutlets": 0,
         "patching_rect": [
          790,
          660,
          140,
          22
         ],
         "presentation": 1,
         "presentation_rect": [
          692.0,
          428.0,
          260.0,
          132.0
         ],
         "bgcolor": [
          0.031,
          0.314,
          0.255,
          0.22
         ],
         "bordercolor": [
          0.059,
          0.431,
          0.337,
          0.5
         ],
         "rounded": 8,
         "border": 1
        }
       },
       {
        "box": {
         "id": "obj-37",
         "maxclass": "panel",
         "numinlets": 1,
         "numoutlets": 0,
         "patching_rect": [
          790,
          390,
          140,
          22
         ],
         "presentation": 1,
         "presentation_rect": [
          542.0,
          428.0,
          120.0,
          132.0
         ],
         "bgcolor": [
          0.267,
          0.267,
          0.255,
          0.22
         ],
         "bordercolor": [
          0.373,
          0.369,
          0.353,
          0.5
         ],
         "rounded": 8,
         "border": 1
        }
       },
       {
        "box": {
         "id": "obj-33",
         "maxclass": "panel",
         "numinlets": 1,
         "numoutlets": 0,
         "patching_rect": [
          30,
          390,
          140,
          22
         ],
         "presentation": 1,
         "presentation_rect": [
          316.0,
          428.0,
          208.0,
          132.0
         ],
         "bgcolor": [
          0.447,
          0.141,
          0.243,
          0.22
         ],
         "bordercolor": [
          0.6,
          0.208,
          0.337,
          0.5
         ],
         "rounded": 8,
         "border": 1
        }
       },
       {
        "box": {
         "id": "obj-28",
         "maxclass": "panel",
         "numinlets": 1,
         "numoutlets": 0,
         "patching_rect": [
          600,
          300,
          140,
          22
         ],
         "presentation": 1,
         "presentation_rect": [
          2.0,
          428.0,
          296.0,
          132.0
         ],
         "bgcolor": [
          0.235,
          0.204,
          0.537,
          0.22
         ],
         "bordercolor": [
          0.325,
          0.29,
          0.718,
          0.5
         ],
         "rounded": 8,
         "border": 1
        }
       },
       {
        "box": {
         "id": "obj-21",
         "maxclass": "panel",
         "numinlets": 1,
         "numoutlets": 0,
         "patching_rect": [
          790,
          210,
          140,
          22
         ],
         "presentation": 1,
         "presentation_rect": [
          470.0,
          262.0,
          384.0,
          154.0
         ],
         "bgcolor": [
          0.388,
          0.22,
          0.024,
          0.22
         ],
         "bordercolor": [
          0.522,
          0.31,
          0.043,
          0.5
         ],
         "rounded": 8,
         "border": 1
        }
       },
       {
        "box": {
         "id": "obj-16",
         "maxclass": "panel",
         "numinlets": 1,
         "numoutlets": 0,
         "patching_rect": [
          1360,
          120,
          140,
          22
         ],
         "presentation": 1,
         "presentation_rect": [
          280.0,
          262.0,
          172.0,
          154.0
         ],
         "bgcolor": [
          0.031,
          0.314,
          0.255,
          0.22
         ],
         "bordercolor": [
          0.059,
          0.431,
          0.337,
          0.5
         ],
         "rounded": 8,
         "border": 1
        }
       },
       {
        "box": {
         "id": "obj-11",
         "maxclass": "panel",
         "numinlets": 1,
         "numoutlets": 0,
         "patching_rect": [
          410,
          120,
          140,
          22
         ],
         "presentation": 1,
         "presentation_rect": [
          2.0,
          262.0,
          260.0,
          154.0
         ],
         "bgcolor": [
          0.443,
          0.169,
          0.075,
          0.22
         ],
         "bordercolor": [
          0.6,
          0.235,
          0.114,
          0.5
         ],
         "rounded": 8,
         "border": 1
        }
       },
       {
        "box": {
         "id": "obj-1",
         "maxclass": "panel",
         "numinlets": 1,
         "numoutlets": 0,
         "patching_rect": [
          30,
          30,
          140,
          22
         ],
         "presentation": 1,
         "presentation_rect": [
          0.0,
          0.0,
          980.0,
          628.0
         ],
         "bgcolor": [
          0.086,
          0.086,
          0.094,
          1.0
         ],
         "bordercolor": [
          0.086,
          0.086,
          0.094,
          1.0
         ],
         "rounded": 0,
         "border": 1
        }
       }
      ],
      "lines": [
       {
        "patchline": {
         "source": [
          "obj-4",
          0
         ],
         "destination": [
          "obj-9",
          0
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "obj-9",
          0
         ],
         "destination": [
          "obj-6",
          0
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "obj-2",
          0
         ],
         "destination": [
          "obj-10",
          0
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "obj-5",
          0
         ],
         "destination": [
          "obj-40",
          0
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "obj-5",
          0
         ],
         "destination": [
          "obj-41",
          0
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "obj-13",
          0
         ],
         "destination": [
          "obj-42",
          0
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "obj-42",
          0
         ],
         "destination": [
          "obj-6",
          0
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "obj-14",
          0
         ],
         "destination": [
          "obj-43",
          0
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "obj-43",
          0
         ],
         "destination": [
          "obj-6",
          0
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "obj-15",
          0
         ],
         "destination": [
          "obj-44",
          0
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "obj-44",
          0
         ],
         "destination": [
          "obj-6",
          0
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "obj-18",
          0
         ],
         "destination": [
          "obj-45",
          0
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "obj-45",
          0
         ],
         "destination": [
          "obj-6",
          0
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "obj-19",
          0
         ],
         "destination": [
          "obj-46",
          0
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "obj-46",
          0
         ],
         "destination": [
          "obj-6",
          0
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "obj-20",
          0
         ],
         "destination": [
          "obj-47",
          0
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "obj-47",
          0
         ],
         "destination": [
          "obj-6",
          0
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "obj-23",
          0
         ],
         "destination": [
          "obj-48",
          0
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "obj-48",
          0
         ],
         "destination": [
          "obj-6",
          0
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "obj-24",
          0
         ],
         "destination": [
          "obj-49",
          0
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "obj-49",
          0
         ],
         "destination": [
          "obj-6",
          0
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "obj-25",
          0
         ],
         "destination": [
          "obj-50",
          0
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "obj-50",
          0
         ],
         "destination": [
          "obj-6",
          0
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "obj-26",
          0
         ],
         "destination": [
          "obj-51",
          0
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "obj-51",
          0
         ],
         "destination": [
          "obj-6",
          0
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "obj-27",
          0
         ],
         "destination": [
          "obj-52",
          0
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "obj-52",
          0
         ],
         "destination": [
          "obj-6",
          0
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "obj-30",
          0
         ],
         "destination": [
          "obj-53",
          0
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "obj-53",
          0
         ],
         "destination": [
          "obj-6",
          0
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "obj-31",
          0
         ],
         "destination": [
          "obj-54",
          0
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "obj-54",
          0
         ],
         "destination": [
          "obj-6",
          0
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "obj-32",
          0
         ],
         "destination": [
          "obj-55",
          0
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "obj-55",
          0
         ],
         "destination": [
          "obj-6",
          0
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "obj-35",
          0
         ],
         "destination": [
          "obj-56",
          0
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "obj-56",
          0
         ],
         "destination": [
          "obj-6",
          0
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "obj-36",
          0
         ],
         "destination": [
          "obj-57",
          0
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "obj-57",
          0
         ],
         "destination": [
          "obj-6",
          0
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "obj-39",
          0
         ],
         "destination": [
          "obj-58",
          0
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "obj-58",
          0
         ],
         "destination": [
          "obj-6",
          0
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "obj-59",
          0
         ],
         "destination": [
          "obj-6",
          0
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "obj-60",
          0
         ],
         "destination": [
          "obj-59",
          0
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "obj-63",
          0
         ],
         "destination": [
          "obj-65",
          0
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "obj-65",
          0
         ],
         "destination": [
          "obj-60",
          0
         ]
        }
       }
      ],
      "title": "PG Bass Generator \u2014 Sound Design"
     },
     "saved_object_attributes": {
      "description": "",
      "digest": "",
      "globalpatchername": "",
      "tags": ""
     },
     "varname": "wave_window",
     "outlettype": [
      ""
     ]
    }
   },
   {
    "box": {
     "id": "obj-58",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      220,
      660,
      140,
      22
     ],
     "text": "pcontrol",
     "outlettype": [
      ""
     ]
    }
   },
   {
    "box": {
     "id": "obj-59",
     "maxclass": "message",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      410,
      660,
      140,
      22
     ],
     "text": "Open GUI",
     "outlettype": [
      ""
     ],
     "presentation": 1,
     "presentation_rect": [
      860.0,
      3.0,
      92.0,
      16.0
     ],
     "fontsize": 9.0
    }
   },
   {
    "box": {
     "id": "obj-60",
     "maxclass": "message",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      600,
      660,
      140,
      22
     ],
     "text": "open",
     "outlettype": [
      ""
     ]
    }
   },
   {
    "box": {
     "id": "obj-61",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      790,
      660,
      140,
      22
     ],
     "text": "*~ 1.",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-62",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      980,
      660,
      140,
      22
     ],
     "text": "*~ 1.",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-63",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      1170,
      660,
      140,
      22
     ],
     "text": "tanh~",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-64",
     "maxclass": "newobj",
     "numinlets": 3,
     "numoutlets": 4,
     "patching_rect": [
      1360,
      660,
      140,
      22
     ],
     "text": "svf~ 800 0.5",
     "outlettype": [
      "signal",
      "signal",
      "signal",
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-65",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      30,
      750,
      140,
      22
     ],
     "text": "*~ 1.",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-66",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      220,
      750,
      140,
      22
     ],
     "text": "*~ 1.",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-67",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      410,
      750,
      140,
      22
     ],
     "text": "+~",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-68",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      600,
      750,
      140,
      22
     ],
     "text": "+~",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-69",
     "maxclass": "newobj",
     "numinlets": 3,
     "numoutlets": 1,
     "patching_rect": [
      790,
      750,
      140,
      22
     ],
     "text": "clip~ 40. 12000.",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-70",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      980,
      750,
      140,
      22
     ],
     "text": "*~ 1.",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-71",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      1170,
      750,
      140,
      22
     ],
     "text": "*~ 0.",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-72",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      1360,
      750,
      140,
      22
     ],
     "text": "+~",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-73",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      30,
      840,
      140,
      22
     ],
     "text": "*~ 1.",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-74",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      220,
      840,
      140,
      22
     ],
     "text": "tanh~",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-75",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      410,
      840,
      140,
      22
     ],
     "text": "*~ 1.",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-76",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      600,
      840,
      140,
      22
     ],
     "text": "onepole~ 120.",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-77",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      790,
      840,
      140,
      22
     ],
     "text": "*~ 0.",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-78",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      980,
      840,
      140,
      22
     ],
     "text": "+~",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-79",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      1170,
      840,
      140,
      22
     ],
     "text": "*~ 0.",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-80",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      1360,
      840,
      140,
      22
     ],
     "text": "*~ 1.",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-81",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      30,
      930,
      140,
      22
     ],
     "text": "+~ 0.",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-82",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      220,
      930,
      140,
      22
     ],
     "text": "tanh~",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-83",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      410,
      930,
      140,
      22
     ],
     "text": "onepole~ 10.",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-84",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      600,
      930,
      140,
      22
     ],
     "text": "-~",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-85",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      790,
      930,
      140,
      22
     ],
     "text": "*~ 0.5",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-86",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      980,
      930,
      140,
      22
     ],
     "text": "+~",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-87",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      1170,
      930,
      140,
      22
     ],
     "text": "mtof~",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-88",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      1360,
      930,
      140,
      22
     ],
     "text": "cycle~",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-89",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      30,
      1020,
      140,
      22
     ],
     "text": "*~ 1.5",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-90",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      220,
      1020,
      140,
      22
     ],
     "text": "tanh~",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-91",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      410,
      1020,
      140,
      22
     ],
     "text": "*~ 1.",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-92",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      600,
      1020,
      140,
      22
     ],
     "text": "*~ 0.",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-93",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      790,
      1020,
      140,
      22
     ],
     "text": "*~ 0.",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-94",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      980,
      1020,
      140,
      22
     ],
     "text": "!-~ 1.",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-95",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      1170,
      1020,
      140,
      22
     ],
     "text": "*~ 1.",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-96",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      1360,
      1020,
      140,
      22
     ],
     "text": "*~ 0.6",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-97",
     "maxclass": "newobj",
     "numinlets": 3,
     "numoutlets": 4,
     "patching_rect": [
      30,
      1110,
      140,
      22
     ],
     "text": "svf~ 500. 0.2",
     "outlettype": [
      "signal",
      "signal",
      "signal",
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-98",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      220,
      1110,
      140,
      22
     ],
     "text": "*~ 0.",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-99",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      410,
      1110,
      140,
      22
     ],
     "text": "*~ 0.6",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-100",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      600,
      1110,
      140,
      22
     ],
     "text": "!-~ 1.",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-101",
     "maxclass": "newobj",
     "numinlets": 5,
     "numoutlets": 1,
     "patching_rect": [
      790,
      1110,
      140,
      22
     ],
     "text": "adsr~ 5 400 0.25 200",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-102",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      980,
      1110,
      140,
      22
     ],
     "text": "*~ 0.65",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-103",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      1170,
      1110,
      140,
      22
     ],
     "text": "+~ 0.35",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-104",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      1360,
      1110,
      140,
      22
     ],
     "text": "*~ 1.",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-105",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      30,
      1200,
      140,
      22
     ],
     "text": "*~ 1.",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-106",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      220,
      1200,
      140,
      22
     ],
     "text": "+~",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-107",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      410,
      1200,
      140,
      22
     ],
     "text": "tapin~ 2000",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-108",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 2,
     "patching_rect": [
      600,
      1200,
      140,
      22
     ],
     "text": "tapout~ 380. 500.",
     "outlettype": [
      "signal",
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-109",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      790,
      1200,
      140,
      22
     ],
     "text": "onepole~ 2400.",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-110",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      980,
      1200,
      140,
      22
     ],
     "text": "*~ 0.3",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-111",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      1170,
      1200,
      140,
      22
     ],
     "text": "sig~ 380.",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-112",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      1360,
      1200,
      140,
      22
     ],
     "text": "sig~ 500.",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-113",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      30,
      1290,
      140,
      22
     ],
     "text": "cycle~ 0.19",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-114",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      220,
      1290,
      140,
      22
     ],
     "text": "cycle~ 0.27",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-115",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      410,
      1290,
      140,
      22
     ],
     "text": "*~ 0.",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-116",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      600,
      1290,
      140,
      22
     ],
     "text": "*~ 0.",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-117",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      790,
      1290,
      140,
      22
     ],
     "text": "+~",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-118",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      980,
      1290,
      140,
      22
     ],
     "text": "+~",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-119",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      1170,
      1290,
      140,
      22
     ],
     "text": "*~ 1.",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-120",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      1360,
      1290,
      140,
      22
     ],
     "text": "*~ 1.",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-121",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      30,
      1380,
      140,
      22
     ],
     "text": "+~",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-122",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      220,
      1380,
      140,
      22
     ],
     "text": "*~ 0.5",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-123",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      410,
      1380,
      140,
      22
     ],
     "text": "-~",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-124",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      600,
      1380,
      140,
      22
     ],
     "text": "*~ 0.5",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-125",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      790,
      1380,
      140,
      22
     ],
     "text": "*~ 1.",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-126",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      980,
      1380,
      140,
      22
     ],
     "text": "+~",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-127",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      1170,
      1380,
      140,
      22
     ],
     "text": "-~",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-128",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      1360,
      1380,
      140,
      22
     ],
     "text": "+~",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-129",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      30,
      1470,
      140,
      22
     ],
     "text": "+~",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-130",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      220,
      1470,
      140,
      22
     ],
     "text": "+~",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-131",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      410,
      1470,
      140,
      22
     ],
     "text": "*~ 0.75",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-132",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      600,
      1470,
      140,
      22
     ],
     "text": "*~ 0.75",
     "outlettype": [
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-133",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 2,
     "patching_rect": [
      790,
      1470,
      140,
      22
     ],
     "text": "plugout~",
     "outlettype": [
      "signal",
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-134",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      980,
      1470,
      140,
      22
     ],
     "text": "midiin",
     "outlettype": [
      "int"
     ]
    }
   }
  ],
  "lines": [
   {
    "patchline": {
     "source": [
      "obj-3",
      0
     ],
     "destination": [
      "obj-4",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-4",
      1
     ],
     "destination": [
      "obj-5",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-5",
      0
     ],
     "destination": [
      "obj-6",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-5",
      1
     ],
     "destination": [
      "obj-6",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-5",
      2
     ],
     "destination": [
      "obj-6",
      2
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-6",
      0
     ],
     "destination": [
      "obj-7",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-7",
      0
     ],
     "destination": [
      "obj-2",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-4",
      0
     ],
     "destination": [
      "obj-2",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-2",
      0
     ],
     "destination": [
      "obj-8",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-2",
      1
     ],
     "destination": [
      "obj-9",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-2",
      2
     ],
     "destination": [
      "obj-10",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-10",
      0
     ],
     "destination": [
      "obj-12",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-12",
      0
     ],
     "destination": [
      "obj-11",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-13",
      0
     ],
     "destination": [
      "obj-14",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-14",
      1
     ],
     "destination": [
      "obj-15",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-15",
      0
     ],
     "destination": [
      "obj-16",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-16",
      0
     ],
     "destination": [
      "obj-2",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-14",
      0
     ],
     "destination": [
      "obj-17",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-17",
      0
     ],
     "destination": [
      "obj-2",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-8",
      35
     ],
     "destination": [
      "obj-18",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-18",
      0
     ],
     "destination": [
      "obj-15",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-2",
      3
     ],
     "destination": [
      "obj-19",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-19",
      0
     ],
     "destination": [
      "obj-2",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-8",
      0
     ],
     "destination": [
      "obj-20",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-8",
      2
     ],
     "destination": [
      "obj-21",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-8",
      3
     ],
     "destination": [
      "obj-22",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-8",
      9
     ],
     "destination": [
      "obj-23",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-8",
      28
     ],
     "destination": [
      "obj-24",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-8",
      29
     ],
     "destination": [
      "obj-25",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-8",
      30
     ],
     "destination": [
      "obj-26",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-8",
      31
     ],
     "destination": [
      "obj-27",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-8",
      32
     ],
     "destination": [
      "obj-28",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-8",
      33
     ],
     "destination": [
      "obj-29",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-8",
      34
     ],
     "destination": [
      "obj-30",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-9",
      0
     ],
     "destination": [
      "obj-31",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-9",
      1
     ],
     "destination": [
      "obj-32",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-28",
      0
     ],
     "destination": [
      "obj-33",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-33",
      0
     ],
     "destination": [
      "obj-34",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-29",
      0
     ],
     "destination": [
      "obj-34",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-33",
      0
     ],
     "destination": [
      "obj-35",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-30",
      0
     ],
     "destination": [
      "obj-35",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-9",
      2
     ],
     "destination": [
      "obj-36",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-9",
      2
     ],
     "destination": [
      "obj-37",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-8",
      6
     ],
     "destination": [
      "obj-36",
      2
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-8",
      7
     ],
     "destination": [
      "obj-36",
      3
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-9",
      5
     ],
     "destination": [
      "obj-37",
      2
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-31",
      0
     ],
     "destination": [
      "obj-38",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-35",
      0
     ],
     "destination": [
      "obj-38",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-38",
      0
     ],
     "destination": [
      "obj-39",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-39",
      0
     ],
     "destination": [
      "obj-40",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-39",
      0
     ],
     "destination": [
      "obj-41",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-26",
      0
     ],
     "destination": [
      "obj-41",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-25",
      0
     ],
     "destination": [
      "obj-42",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-42",
      0
     ],
     "destination": [
      "obj-45",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-45",
      0
     ],
     "destination": [
      "obj-43",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-25",
      0
     ],
     "destination": [
      "obj-46",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-46",
      0
     ],
     "destination": [
      "obj-44",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-40",
      0
     ],
     "destination": [
      "obj-43",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-41",
      0
     ],
     "destination": [
      "obj-44",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-43",
      0
     ],
     "destination": [
      "obj-47",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-44",
      0
     ],
     "destination": [
      "obj-47",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-27",
      0
     ],
     "destination": [
      "obj-48",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-48",
      0
     ],
     "destination": [
      "obj-49",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-47",
      0
     ],
     "destination": [
      "obj-50",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-49",
      0
     ],
     "destination": [
      "obj-50",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-51",
      0
     ],
     "destination": [
      "obj-52",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-50",
      0
     ],
     "destination": [
      "obj-52",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-27",
      0
     ],
     "destination": [
      "obj-53",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-47",
      0
     ],
     "destination": [
      "obj-54",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-53",
      0
     ],
     "destination": [
      "obj-54",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-52",
      0
     ],
     "destination": [
      "obj-55",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-27",
      0
     ],
     "destination": [
      "obj-55",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-54",
      0
     ],
     "destination": [
      "obj-56",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-55",
      0
     ],
     "destination": [
      "obj-56",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-56",
      0
     ],
     "destination": [
      "obj-57",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-57",
      0
     ],
     "destination": [
      "obj-2",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-2",
      3
     ],
     "destination": [
      "obj-57",
      2
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-2",
      0
     ],
     "destination": [
      "obj-57",
      3
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-58",
      0
     ],
     "destination": [
      "obj-57",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-59",
      0
     ],
     "destination": [
      "obj-60",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-60",
      0
     ],
     "destination": [
      "obj-58",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-56",
      0
     ],
     "destination": [
      "obj-61",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-22",
      0
     ],
     "destination": [
      "obj-61",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-61",
      0
     ],
     "destination": [
      "obj-62",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-9",
      4
     ],
     "destination": [
      "obj-62",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-62",
      0
     ],
     "destination": [
      "obj-63",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-63",
      0
     ],
     "destination": [
      "obj-64",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-8",
      1
     ],
     "destination": [
      "obj-64",
      2
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-37",
      0
     ],
     "destination": [
      "obj-65",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-21",
      0
     ],
     "destination": [
      "obj-65",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-65",
      0
     ],
     "destination": [
      "obj-66",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-9",
      3
     ],
     "destination": [
      "obj-66",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-66",
      0
     ],
     "destination": [
      "obj-67",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-20",
      0
     ],
     "destination": [
      "obj-67",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-67",
      0
     ],
     "destination": [
      "obj-68",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-34",
      0
     ],
     "destination": [
      "obj-68",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-68",
      0
     ],
     "destination": [
      "obj-69",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-69",
      0
     ],
     "destination": [
      "obj-64",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-64",
      0
     ],
     "destination": [
      "obj-70",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-8",
      14
     ],
     "destination": [
      "obj-70",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-64",
      2
     ],
     "destination": [
      "obj-71",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-8",
      15
     ],
     "destination": [
      "obj-71",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-70",
      0
     ],
     "destination": [
      "obj-72",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-71",
      0
     ],
     "destination": [
      "obj-72",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-72",
      0
     ],
     "destination": [
      "obj-73",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-8",
      16
     ],
     "destination": [
      "obj-73",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-73",
      0
     ],
     "destination": [
      "obj-74",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-74",
      0
     ],
     "destination": [
      "obj-75",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-8",
      17
     ],
     "destination": [
      "obj-75",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-75",
      0
     ],
     "destination": [
      "obj-76",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-76",
      0
     ],
     "destination": [
      "obj-77",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-8",
      18
     ],
     "destination": [
      "obj-77",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-75",
      0
     ],
     "destination": [
      "obj-78",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-77",
      0
     ],
     "destination": [
      "obj-78",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-78",
      0
     ],
     "destination": [
      "obj-79",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-36",
      0
     ],
     "destination": [
      "obj-79",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-79",
      0
     ],
     "destination": [
      "obj-80",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-8",
      4
     ],
     "destination": [
      "obj-80",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-80",
      0
     ],
     "destination": [
      "obj-81",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-81",
      0
     ],
     "destination": [
      "obj-82",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-82",
      0
     ],
     "destination": [
      "obj-83",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-82",
      0
     ],
     "destination": [
      "obj-84",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-83",
      0
     ],
     "destination": [
      "obj-84",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-8",
      26
     ],
     "destination": [
      "obj-81",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-9",
      6
     ],
     "destination": [
      "obj-81",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-84",
      0
     ],
     "destination": [
      "obj-85",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-8",
      5
     ],
     "destination": [
      "obj-85",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-32",
      0
     ],
     "destination": [
      "obj-86",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-35",
      0
     ],
     "destination": [
      "obj-86",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-86",
      0
     ],
     "destination": [
      "obj-87",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-87",
      0
     ],
     "destination": [
      "obj-88",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-88",
      0
     ],
     "destination": [
      "obj-89",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-8",
      23
     ],
     "destination": [
      "obj-89",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-89",
      0
     ],
     "destination": [
      "obj-90",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-90",
      0
     ],
     "destination": [
      "obj-91",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-8",
      24
     ],
     "destination": [
      "obj-91",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-91",
      0
     ],
     "destination": [
      "obj-92",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-36",
      0
     ],
     "destination": [
      "obj-92",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-37",
      0
     ],
     "destination": [
      "obj-93",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-93",
      0
     ],
     "destination": [
      "obj-94",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-8",
      25
     ],
     "destination": [
      "obj-93",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-92",
      0
     ],
     "destination": [
      "obj-95",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-94",
      0
     ],
     "destination": [
      "obj-95",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-95",
      0
     ],
     "destination": [
      "obj-96",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-8",
      8
     ],
     "destination": [
      "obj-96",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-85",
      0
     ],
     "destination": [
      "obj-97",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-24",
      0
     ],
     "destination": [
      "obj-97",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-97",
      1
     ],
     "destination": [
      "obj-98",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-23",
      0
     ],
     "destination": [
      "obj-98",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-36",
      0
     ],
     "destination": [
      "obj-99",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-99",
      0
     ],
     "destination": [
      "obj-100",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-8",
      10
     ],
     "destination": [
      "obj-99",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-9",
      2
     ],
     "destination": [
      "obj-101",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-8",
      21
     ],
     "destination": [
      "obj-101",
      2
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-101",
      0
     ],
     "destination": [
      "obj-102",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-8",
      19
     ],
     "destination": [
      "obj-102",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-102",
      0
     ],
     "destination": [
      "obj-103",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-8",
      20
     ],
     "destination": [
      "obj-103",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-98",
      0
     ],
     "destination": [
      "obj-104",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-103",
      0
     ],
     "destination": [
      "obj-104",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-104",
      0
     ],
     "destination": [
      "obj-105",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-100",
      0
     ],
     "destination": [
      "obj-105",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-105",
      0
     ],
     "destination": [
      "obj-106",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-106",
      0
     ],
     "destination": [
      "obj-107",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-107",
      0
     ],
     "destination": [
      "obj-108",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-108",
      0
     ],
     "destination": [
      "obj-109",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-109",
      0
     ],
     "destination": [
      "obj-110",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-8",
      11
     ],
     "destination": [
      "obj-110",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-110",
      0
     ],
     "destination": [
      "obj-106",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-8",
      12
     ],
     "destination": [
      "obj-111",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-8",
      13
     ],
     "destination": [
      "obj-112",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-113",
      0
     ],
     "destination": [
      "obj-115",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-114",
      0
     ],
     "destination": [
      "obj-116",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-8",
      22
     ],
     "destination": [
      "obj-115",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-8",
      22
     ],
     "destination": [
      "obj-116",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-111",
      0
     ],
     "destination": [
      "obj-117",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-115",
      0
     ],
     "destination": [
      "obj-117",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-112",
      0
     ],
     "destination": [
      "obj-118",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-116",
      0
     ],
     "destination": [
      "obj-118",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-117",
      0
     ],
     "destination": [
      "obj-108",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-118",
      0
     ],
     "destination": [
      "obj-108",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-108",
      0
     ],
     "destination": [
      "obj-119",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-100",
      0
     ],
     "destination": [
      "obj-119",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-108",
      1
     ],
     "destination": [
      "obj-120",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-100",
      0
     ],
     "destination": [
      "obj-120",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-119",
      0
     ],
     "destination": [
      "obj-121",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-120",
      0
     ],
     "destination": [
      "obj-121",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-121",
      0
     ],
     "destination": [
      "obj-122",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-119",
      0
     ],
     "destination": [
      "obj-123",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-120",
      0
     ],
     "destination": [
      "obj-123",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-123",
      0
     ],
     "destination": [
      "obj-124",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-124",
      0
     ],
     "destination": [
      "obj-125",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-122",
      0
     ],
     "destination": [
      "obj-126",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-125",
      0
     ],
     "destination": [
      "obj-126",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-122",
      0
     ],
     "destination": [
      "obj-127",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-125",
      0
     ],
     "destination": [
      "obj-127",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-8",
      27
     ],
     "destination": [
      "obj-125",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-85",
      0
     ],
     "destination": [
      "obj-128",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-96",
      0
     ],
     "destination": [
      "obj-128",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-128",
      0
     ],
     "destination": [
      "obj-129",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-126",
      0
     ],
     "destination": [
      "obj-129",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-128",
      0
     ],
     "destination": [
      "obj-130",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-127",
      0
     ],
     "destination": [
      "obj-130",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-129",
      0
     ],
     "destination": [
      "obj-131",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-130",
      0
     ],
     "destination": [
      "obj-132",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-131",
      0
     ],
     "destination": [
      "obj-133",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-132",
      0
     ],
     "destination": [
      "obj-133",
      1
     ]
    }
   }
  ]
 }
}
