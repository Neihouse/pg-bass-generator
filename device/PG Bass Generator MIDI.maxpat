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
   "obj-3": [
    "Novelty",
    "Novelty",
    0
   ],
   "obj-4": [
    "Density",
    "Density",
    0
   ],
   "obj-5": [
    "Interlock",
    "Interlock",
    0
   ],
   "obj-6": [
    "Chunk",
    "Chunk",
    0
   ],
   "obj-7": [
    "Squelch",
    "Squelch",
    0
   ],
   "obj-8": [
    "Drive",
    "Drive",
    0
   ],
   "obj-9": [
    "Cutoff",
    "Cutoff",
    0
   ],
   "obj-10": [
    "Decay",
    "Decay",
    0
   ],
   "obj-11": [
    "Sub",
    "Sub",
    0
   ],
   "obj-12": [
    "SubSat",
    "SubSat",
    0
   ],
   "obj-13": [
    "Wet",
    "Wet",
    0
   ],
   "obj-14": [
    "Width",
    "Width",
    0
   ],
   "obj-15": [
    "Groove",
    "Groove",
    0
   ],
   "obj-16": [
    "Mode",
    "Mode",
    0
   ],
   "obj-17": [
    "Root",
    "Root",
    0
   ],
   "obj-18": [
    "Length",
    "Length",
    0
   ],
   "obj-19": [
    "SubOct",
    "SubOct",
    0
   ],
   "obj-20": [
    "Lock",
    "Lock",
    0
   ],
   "obj-22": [
    "FrzRhythm",
    "FrzRhythm",
    0
   ],
   "obj-24": [
    "FrzPitch",
    "FrzPitch",
    0
   ],
   "obj-26": [
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
      "Chunk",
      "Squelch",
      "Drive",
      "Cutoff",
      "Decay"
     ]
    },
    "1": {
     "index": 1,
     "name": "",
     "parameters": [
      "Sub",
      "SubSat",
      "Wet",
      "Width",
      "Groove",
      "Mode",
      "Root",
      "Length"
     ]
    },
    "2": {
     "index": 2,
     "name": "",
     "parameters": [
      "SubOct",
      "Lock",
      "FrzRhythm",
      "FrzPitch",
      "FrzTimbre",
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
   "amxdtype": 1835887981,
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
      18.0
     ],
     "fontface": 1,
     "fontsize": 11.0
    }
   },
   {
    "box": {
     "id": "obj-2",
     "maxclass": "message",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      220,
      30,
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
      4.0,
      252.0,
      16.0
     ],
     "fontsize": 9.0
    }
   },
   {
    "box": {
     "id": "obj-3",
     "maxclass": "live.dial",
     "numinlets": 1,
     "numoutlets": 2,
     "patching_rect": [
      410,
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
      4.0,
      24.0,
      48.0,
      64.0
     ],
     "varname": "novelty",
     "parameter_enable": 1,
     "saved_attribute_attributes": {
      "valueof": {
       "parameter_initial": [
        0.35
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
     "id": "obj-4",
     "maxclass": "live.dial",
     "numinlets": 1,
     "numoutlets": 2,
     "patching_rect": [
      600,
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
      54.0,
      24.0,
      48.0,
      64.0
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
     "id": "obj-5",
     "maxclass": "live.dial",
     "numinlets": 1,
     "numoutlets": 2,
     "patching_rect": [
      790,
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
      104.0,
      24.0,
      48.0,
      64.0
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
     "id": "obj-6",
     "maxclass": "live.dial",
     "numinlets": 1,
     "numoutlets": 2,
     "patching_rect": [
      980,
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
      154.0,
      24.0,
      48.0,
      64.0
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
     "id": "obj-7",
     "maxclass": "live.dial",
     "numinlets": 1,
     "numoutlets": 2,
     "patching_rect": [
      1170,
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
      204.0,
      24.0,
      48.0,
      64.0
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
      254.0,
      24.0,
      48.0,
      64.0
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
      304.0,
      24.0,
      48.0,
      64.0
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
      354.0,
      24.0,
      48.0,
      64.0
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
     "id": "obj-11",
     "maxclass": "live.dial",
     "numinlets": 1,
     "numoutlets": 2,
     "patching_rect": [
      410,
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
      404.0,
      24.0,
      48.0,
      64.0
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
     "id": "obj-12",
     "maxclass": "live.dial",
     "numinlets": 1,
     "numoutlets": 2,
     "patching_rect": [
      600,
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
      454.0,
      24.0,
      48.0,
      64.0
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
      504.0,
      24.0,
      48.0,
      64.0
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
      554.0,
      24.0,
      48.0,
      64.0
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
     "id": "obj-15",
     "maxclass": "live.menu",
     "numinlets": 1,
     "numoutlets": 3,
     "patching_rect": [
      1170,
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
      4.0,
      96.0,
      112.0,
      15.0
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
     "id": "obj-16",
     "maxclass": "live.menu",
     "numinlets": 1,
     "numoutlets": 3,
     "patching_rect": [
      1360,
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
      120.0,
      96.0,
      92.0,
      15.0
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
     "id": "obj-17",
     "maxclass": "live.menu",
     "numinlets": 1,
     "numoutlets": 3,
     "patching_rect": [
      30,
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
      216.0,
      96.0,
      58.0,
      15.0
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
     "id": "obj-18",
     "maxclass": "live.menu",
     "numinlets": 1,
     "numoutlets": 3,
     "patching_rect": [
      220,
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
      278.0,
      96.0,
      70.0,
      15.0
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
     "id": "obj-19",
     "maxclass": "live.menu",
     "numinlets": 1,
     "numoutlets": 3,
     "patching_rect": [
      410,
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
      352.0,
      96.0,
      66.0,
      15.0
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
      424.0,
      96.0,
      15.0,
      15.0
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
     "text": "lock",
     "presentation": 1,
     "presentation_rect": [
      441.0,
      96.0,
      30.0,
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
      474.0,
      96.0,
      15.0,
      15.0
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
     "text": "rhy",
     "presentation": 1,
     "presentation_rect": [
      491.0,
      96.0,
      26.0,
      16.0
     ],
     "fontsize": 9.0
    }
   },
   {
    "box": {
     "id": "obj-24",
     "maxclass": "live.toggle",
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
      520.0,
      96.0,
      15.0,
      15.0
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
     "text": "pit",
     "presentation": 1,
     "presentation_rect": [
      537.0,
      96.0,
      26.0,
      16.0
     ],
     "fontsize": 9.0
    }
   },
   {
    "box": {
     "id": "obj-26",
     "maxclass": "live.toggle",
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
      566.0,
      96.0,
      15.0,
      15.0
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
     "id": "obj-27",
     "maxclass": "comment",
     "numinlets": 1,
     "numoutlets": 0,
     "patching_rect": [
      410,
      300,
      140,
      22
     ],
     "text": "tim",
     "presentation": 1,
     "presentation_rect": [
      583.0,
      96.0,
      26.0,
      16.0
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
     "text": "Mutate",
     "outlettype": [
      ""
     ],
     "presentation": 1,
     "presentation_rect": [
      4.0,
      120.0,
      54.0,
      18.0
     ],
     "fontsize": 9.0
    }
   },
   {
    "box": {
     "id": "obj-29",
     "maxclass": "message",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      790,
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
      62.0,
      120.0,
      54.0,
      18.0
     ],
     "fontsize": 9.0
    }
   },
   {
    "box": {
     "id": "obj-30",
     "maxclass": "message",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      980,
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
      120.0,
      120.0,
      54.0,
      18.0
     ],
     "fontsize": 9.0
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
      178.0,
      120.0,
      54.0,
      18.0
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
      236.0,
      120.0,
      54.0,
      18.0
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
      294.0,
      120.0,
      54.0,
      18.0
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
      352.0,
      120.0,
      54.0,
      18.0
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
     "text": "Capture",
     "outlettype": [
      ""
     ],
     "presentation": 1,
     "presentation_rect": [
      410.0,
      120.0,
      54.0,
      18.0
     ],
     "fontsize": 9.0
    }
   },
   {
    "box": {
     "id": "obj-36",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 3,
     "patching_rect": [
      600,
      390,
      140,
      22
     ],
     "text": "js pg-core.js",
     "outlettype": [
      "",
      "",
      ""
     ]
    }
   },
   {
    "box": {
     "id": "obj-37",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 3,
     "patching_rect": [
      790,
      390,
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
     "text": "pushall",
     "outlettype": [
      ""
     ]
    }
   },
   {
    "box": {
     "id": "obj-39",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      1170,
      390,
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
     "id": "obj-40",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 2,
     "patching_rect": [
      1360,
      390,
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
     "id": "obj-41",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 8,
     "patching_rect": [
      30,
      480,
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
     "id": "obj-42",
     "maxclass": "newobj",
     "numinlets": 3,
     "numoutlets": 1,
     "patching_rect": [
      220,
      480,
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
     "text": "prepend pos",
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
     "text": "prepend novelty",
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
     "text": "prepend density",
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
     "text": "prepend interlock",
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
     "text": "prepend chunk",
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
     "text": "prepend drive",
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
     "text": "prepend cutoff",
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
     "text": "prepend decay",
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
     "text": "prepend sub",
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
     "text": "prepend subsat",
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
     "text": "prepend wet",
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
     "text": "prepend width",
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
     "text": "prepend groove",
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
     "text": "prepend fmode",
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
     "text": "prepend root",
     "outlettype": [
      ""
     ]
    }
   },
   {
    "box": {
     "id": "obj-59",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      410,
      660,
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
     "text": "prepend suboct",
     "outlettype": [
      ""
     ]
    }
   },
   {
    "box": {
     "id": "obj-61",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      790,
      660,
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
     "id": "obj-62",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      980,
      660,
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
     "text": "prepend frzp",
     "outlettype": [
      ""
     ]
    }
   },
   {
    "box": {
     "id": "obj-64",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      1360,
      660,
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
     "id": "obj-65",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 2,
     "patching_rect": [
      30,
      750,
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
     "id": "obj-66",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 3,
     "patching_rect": [
      220,
      750,
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
     "id": "obj-67",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      410,
      750,
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
     "id": "obj-68",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 31,
     "patching_rect": [
      600,
      750,
      140,
      22
     ],
     "text": "route cutoff reso envd drv post gain adec asus sub wet duck fb dly dly2 lpamt bpamt nlin nlout shelf wamt wflr wdec dmod subdrv subgain subduck asym width monof state",
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
      ""
     ]
    }
   },
   {
    "box": {
     "id": "obj-69",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 9,
     "patching_rect": [
      790,
      750,
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
     "id": "obj-70",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 3,
     "patching_rect": [
      980,
      750,
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
     "id": "obj-71",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      1170,
      750,
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
     "id": "obj-72",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      1360,
      750,
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
     "id": "obj-73",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      30,
      840,
      140,
      22
     ],
     "text": "midiin",
     "outlettype": [
      "int"
     ]
    }
   },
   {
    "box": {
     "id": "obj-74",
     "maxclass": "newobj",
     "numinlets": 3,
     "numoutlets": 2,
     "patching_rect": [
      220,
      840,
      140,
      22
     ],
     "text": "makenote 100 200",
     "outlettype": [
      "int",
      "int"
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
     "text": "pack 0 0",
     "outlettype": [
      ""
     ]
    }
   },
   {
    "box": {
     "id": "obj-76",
     "maxclass": "newobj",
     "numinlets": 8,
     "numoutlets": 2,
     "patching_rect": [
      600,
      840,
      140,
      22
     ],
     "text": "midiformat",
     "outlettype": [
      "int",
      ""
     ]
    }
   },
   {
    "box": {
     "id": "obj-77",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 0,
     "patching_rect": [
      790,
      840,
      140,
      22
     ],
     "text": "midiout"
    }
   },
   {
    "box": {
     "id": "obj-78",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      980,
      840,
      140,
      22
     ],
     "text": "if $f1 <= 0. then stop",
     "outlettype": [
      ""
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
      "obj-36",
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
      "obj-36",
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
      "obj-36",
      0
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
      "obj-36",
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
      "obj-36",
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
      "obj-36",
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
      "obj-36",
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
      "obj-36",
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
      "obj-36",
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
      "obj-36",
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
      "obj-36",
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
      "obj-36",
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
      "obj-36",
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
      "obj-36",
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
      "obj-36",
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
      "obj-59",
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
      "obj-36",
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
      "obj-36",
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
      "obj-61",
      0
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
      "obj-36",
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
      "obj-62",
      0
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
      "obj-36",
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
      "obj-36",
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
      "obj-64",
      0
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
      "obj-36",
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
      "obj-36",
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
      "obj-36",
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
      "obj-36",
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
      "obj-36",
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
      "obj-36",
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
      "obj-36",
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
      "obj-36",
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
      "obj-36",
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
      "obj-40",
      1
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
      "obj-42",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-41",
      1
     ],
     "destination": [
      "obj-42",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-41",
      2
     ],
     "destination": [
      "obj-42",
      2
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
      "obj-36",
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
      "obj-36",
      0
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
      "obj-65",
      1
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
      "obj-67",
      0
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
      "obj-65",
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
      "obj-38",
      0
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
      "obj-36",
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
      "obj-36",
      1
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
      "obj-36",
      2
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
      "obj-70",
      0
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
      "obj-71",
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
      "obj-68",
      29
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
      "obj-72",
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
      "obj-69",
      7
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
      1
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
      "obj-69",
      2
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
      "obj-78",
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
      "obj-73",
      0
     ],
     "destination": [
      "obj-77",
      0
     ]
    }
   }
  ]
 }
}
