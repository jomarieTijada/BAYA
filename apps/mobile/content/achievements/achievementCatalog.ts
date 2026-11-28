import type { AchievementDefinition } from './achievementTypes';

export const achievementCatalog: readonly AchievementDefinition[] = [
  {
    "id": "first_step",
    "catalogNumber": 1,
    "title": {
      "en": "Unang Hakbang",
      "tl": "Unang Hakbang"
    },
    "description": {
      "en": "Completed your first Baybayin lesson.",
      "tl": "Tapusin ang unang aralin sa Baybayin."
    },
    "requirement": {
      "en": "Complete the first distinct instructional topic using the existing topic-completion policy.",
      "tl": "Tapusin ang unang aralin sa Baybayin."
    },
    "category": "learning-journey",
    "iconKey": "footsteps-outline",
    "condition": {
      "type": "topics",
      "ids": [],
      "minimum": 1
    },
    "starValue": 1,
    "proposedStars": 1,
    "sortOrder": 1,
    "availability": "available",
    "definitionVersion": 1
  },
  {
    "id": "time_traveler",
    "catalogNumber": 2,
    "title": {
      "en": "Time Traveler",
      "tl": "Manlalakbay sa Nakaraan"
    },
    "description": {
      "en": "Discovered the history of Baybayin.",
      "tl": "Tapusin ang Time Traveler."
    },
    "requirement": {
      "en": "Complete History and Importance of Baybayin.",
      "tl": "Tapusin ang Time Traveler."
    },
    "category": "learning-journey",
    "iconKey": "hourglass-outline",
    "condition": {
      "type": "topics",
      "ids": [
        "topic-1-1"
      ]
    },
    "starValue": 1,
    "proposedStars": 1,
    "sortOrder": 2,
    "availability": "available",
    "definitionVersion": 1
  },
  {
    "id": "script_sleuth",
    "catalogNumber": 3,
    "title": {
      "en": "Script Sleuth",
      "tl": "Detektib ng Sulat"
    },
    "description": {
      "en": "Learned how the Baybayin syllabary works.",
      "tl": "Tapusin ang Script Sleuth."
    },
    "requirement": {
      "en": "Complete Baybayin: A Syllabary.",
      "tl": "Tapusin ang Script Sleuth."
    },
    "category": "learning-journey",
    "iconKey": "search-outline",
    "condition": {
      "type": "topics",
      "ids": [
        "topic-1-2"
      ]
    },
    "starValue": 1,
    "proposedStars": 1,
    "sortOrder": 3,
    "availability": "available",
    "definitionVersion": 1
  },
  {
    "id": "seventeen_stars",
    "catalogNumber": 4,
    "title": {
      "en": "Seventeen Stars",
      "tl": "Labimpitong Bituin"
    },
    "description": {
      "en": "Learned about the 17 foundational characters.",
      "tl": "Tapusin ang Seventeen Stars."
    },
    "requirement": {
      "en": "Complete The 17 Characters of Baybayin topic.",
      "tl": "Tapusin ang Seventeen Stars."
    },
    "category": "learning-journey",
    "iconKey": "sparkles-outline",
    "condition": {
      "type": "topics",
      "ids": [
        "topic-1-3"
      ]
    },
    "starValue": 2,
    "proposedStars": 2,
    "sortOrder": 4,
    "availability": "available",
    "definitionVersion": 1
  },
  {
    "id": "heritage_keeper",
    "catalogNumber": 5,
    "title": {
      "en": "Heritage Keeper",
      "tl": "Tagapag-ingat ng Pamana"
    },
    "description": {
      "en": "Completed the introduction to Baybayin.",
      "tl": "Tapusin ang lahat ng kinakailangang aralin sa Pagkilala sa Baybayin."
    },
    "requirement": {
      "en": "Complete every required instructional topic in Introduction to Baybayin.",
      "tl": "Tapusin ang lahat ng kinakailangang aralin sa Pagkilala sa Baybayin."
    },
    "category": "learning-journey",
    "iconKey": "business-outline",
    "condition": {
      "type": "module",
      "id": "module-1"
    },
    "starValue": 3,
    "proposedStars": 3,
    "sortOrder": 5,
    "availability": "available",
    "definitionVersion": 1
  },
  {
    "id": "vowel_voyager",
    "catalogNumber": 6,
    "title": {
      "en": "Vowel Voyager",
      "tl": "Manlalakbay sa Patinig"
    },
    "description": {
      "en": "Explored the wonderful world of vowels.",
      "tl": "Tapusin ang Vowel Voyager."
    },
    "requirement": {
      "en": "Complete The Vowels instructional topic.",
      "tl": "Tapusin ang Vowel Voyager."
    },
    "category": "learning-journey",
    "iconKey": "compass-outline",
    "condition": {
      "type": "topics",
      "ids": [
        "topic-2-1"
      ]
    },
    "starValue": 1,
    "proposedStars": 1,
    "sortOrder": 6,
    "availability": "available",
    "definitionVersion": 1
  },
  {
    "id": "consonant_companion",
    "catalogNumber": 7,
    "title": {
      "en": "Consonant Companion",
      "tl": "Kaibigan ng Katinig"
    },
    "description": {
      "en": "Learned the basic Baybayin consonants.",
      "tl": "Tapusin ang Consonant Companion."
    },
    "requirement": {
      "en": "Complete Meet the Consonants.",
      "tl": "Tapusin ang Consonant Companion."
    },
    "category": "learning-journey",
    "iconKey": "people-outline",
    "condition": {
      "type": "topics",
      "ids": [
        "topic-2-2"
      ]
    },
    "starValue": 2,
    "proposedStars": 2,
    "sortOrder": 7,
    "availability": "available",
    "definitionVersion": 1
  },
  {
    "id": "character_champion",
    "catalogNumber": 8,
    "title": {
      "en": "Character Champion",
      "tl": "Kampeon ng mga Simbolo"
    },
    "description": {
      "en": "Completed Baybayin Characters.",
      "tl": "Tapusin ang lahat ng kinakailangang aralin sa mga Simbolo ng Baybayin."
    },
    "requirement": {
      "en": "Complete all required instructional topics in Baybayin Characters.",
      "tl": "Tapusin ang lahat ng kinakailangang aralin sa mga Simbolo ng Baybayin."
    },
    "category": "learning-journey",
    "iconKey": "medal-outline",
    "condition": {
      "type": "module",
      "id": "module-2"
    },
    "starValue": 3,
    "proposedStars": 3,
    "sortOrder": 8,
    "availability": "available",
    "definitionVersion": 1
  },
  {
    "id": "kudlit_climber",
    "catalogNumber": 9,
    "title": {
      "en": "Kudlit Climber",
      "tl": "Umaakyat sa Kudlit"
    },
    "description": {
      "en": "Learned how upper kudlit works.",
      "tl": "Tapusin ang Kudlit Climber."
    },
    "requirement": {
      "en": "Complete the Upper Kudlit instructional topic.",
      "tl": "Tapusin ang Kudlit Climber."
    },
    "category": "learning-journey",
    "iconKey": "trending-up-outline",
    "condition": {
      "type": "topics",
      "ids": [
        "topic-kudlit-upper"
      ]
    },
    "starValue": 2,
    "proposedStars": 2,
    "sortOrder": 9,
    "availability": "available",
    "definitionVersion": 1
  },
  {
    "id": "kudlit_diver",
    "catalogNumber": 10,
    "title": {
      "en": "Kudlit Diver",
      "tl": "Sumisisid sa Kudlit"
    },
    "description": {
      "en": "Learned how lower kudlit works.",
      "tl": "Tapusin ang Kudlit Diver."
    },
    "requirement": {
      "en": "Complete the Lower Kudlit instructional topic.",
      "tl": "Tapusin ang Kudlit Diver."
    },
    "category": "learning-journey",
    "iconKey": "water-outline",
    "condition": {
      "type": "topics",
      "ids": [
        "topic-kudlit-lower"
      ]
    },
    "starValue": 2,
    "proposedStars": 2,
    "sortOrder": 10,
    "availability": "available",
    "definitionVersion": 1
  },
  {
    "id": "three_vowels",
    "catalogNumber": 11,
    "title": {
      "en": "Tatlong Patinig",
      "tl": "Tatlong Patinig"
    },
    "description": {
      "en": "Explored all three Baybayin vowel groups.",
      "tl": "Piliin at tuklasin ang 3 magkakaibang patinig."
    },
    "requirement": {
      "en": "Deliberately explore all three standalone vowel-character groups: A, E/I, and O/U.",
      "tl": "Piliin at tuklasin ang 3 magkakaibang patinig."
    },
    "category": "baybayin-discovery",
    "iconKey": "apps-outline",
    "condition": {
      "type": "exploration",
      "group": "vowel",
      "minimum": 3
    },
    "starValue": 2,
    "proposedStars": 2,
    "sortOrder": 11,
    "availability": "available",
    "definitionVersion": 1
  },
  {
    "id": "first_feather",
    "catalogNumber": 12,
    "title": {
      "en": "First Feather",
      "tl": "Unang Balahibo"
    },
    "description": {
      "en": "Discovered your first base consonant.",
      "tl": "Piliin at tuklasin ang 1 magkakaibang batayang katinig."
    },
    "requirement": {
      "en": "Deliberately explore one distinct base-consonant reference.",
      "tl": "Piliin at tuklasin ang 1 magkakaibang batayang katinig."
    },
    "category": "baybayin-discovery",
    "iconKey": "leaf-outline",
    "condition": {
      "type": "exploration",
      "group": "base-consonant",
      "minimum": 1
    },
    "starValue": 1,
    "proposedStars": 1,
    "sortOrder": 12,
    "availability": "available",
    "definitionVersion": 1
  },
  {
    "id": "seven_symbols",
    "catalogNumber": 13,
    "title": {
      "en": "Seven Symbols",
      "tl": "Pitong Simbolo"
    },
    "description": {
      "en": "Explored seven basic consonants.",
      "tl": "Piliin at tuklasin ang 7 magkakaibang batayang katinig."
    },
    "requirement": {
      "en": "Explore seven distinct base-consonant groups.",
      "tl": "Piliin at tuklasin ang 7 magkakaibang batayang katinig."
    },
    "category": "baybayin-discovery",
    "iconKey": "grid-outline",
    "condition": {
      "type": "exploration",
      "group": "base-consonant",
      "minimum": 7
    },
    "starValue": 2,
    "proposedStars": 2,
    "sortOrder": 13,
    "availability": "available",
    "definitionVersion": 1
  },
  {
    "id": "fourteen_feathers",
    "catalogNumber": 14,
    "title": {
      "en": "Fourteen Feathers",
      "tl": "Labing-apat na Balahibo"
    },
    "description": {
      "en": "Discovered all 14 basic consonant groups.",
      "tl": "Piliin at tuklasin ang 14 magkakaibang batayang katinig."
    },
    "requirement": {
      "en": "Explore all 14 traditional base-consonant groups.",
      "tl": "Piliin at tuklasin ang 14 magkakaibang batayang katinig."
    },
    "category": "baybayin-discovery",
    "iconKey": "airplane-outline",
    "condition": {
      "type": "exploration",
      "group": "base-consonant",
      "minimum": 14
    },
    "starValue": 3,
    "proposedStars": 3,
    "sortOrder": 14,
    "availability": "available",
    "definitionVersion": 1
  },
  {
    "id": "symbol_collector",
    "catalogNumber": 15,
    "title": {
      "en": "Symbol Collector",
      "tl": "Kolektor ng Simbolo"
    },
    "description": {
      "en": "Collected all 17 foundational character groups.",
      "tl": "Piliin at tuklasin ang 17 magkakaibang batayang simbolo."
    },
    "requirement": {
      "en": "Explore all 17 foundational character groups: three vowel groups and 14 base-consonant groups.",
      "tl": "Piliin at tuklasin ang 17 magkakaibang batayang simbolo."
    },
    "category": "baybayin-discovery",
    "iconKey": "albums-outline",
    "condition": {
      "type": "exploration",
      "group": "foundation",
      "minimum": 17
    },
    "starValue": 4,
    "proposedStars": 4,
    "sortOrder": 15,
    "availability": "available",
    "definitionVersion": 1
  },
  {
    "id": "upper_mark_explorer",
    "catalogNumber": 16,
    "title": {
      "en": "Upper Mark Explorer",
      "tl": "Tuklas sa Itaas"
    },
    "description": {
      "en": "Explored five upper-kudlit forms.",
      "tl": "Piliin at tuklasin ang 5 magkakaibang simbolong may kudlit sa itaas."
    },
    "requirement": {
      "en": "Explore five distinct upper-kudlit written forms.",
      "tl": "Piliin at tuklasin ang 5 magkakaibang simbolong may kudlit sa itaas."
    },
    "category": "baybayin-discovery",
    "iconKey": "arrow-up-circle-outline",
    "condition": {
      "type": "exploration",
      "group": "upper-kudlit",
      "minimum": 5
    },
    "starValue": 2,
    "proposedStars": 2,
    "sortOrder": 16,
    "availability": "available",
    "definitionVersion": 1
  },
  {
    "id": "lower_mark_explorer",
    "catalogNumber": 17,
    "title": {
      "en": "Lower Mark Explorer",
      "tl": "Tuklas sa Ibaba"
    },
    "description": {
      "en": "Explored five lower-kudlit forms.",
      "tl": "Piliin at tuklasin ang 5 magkakaibang simbolong may kudlit sa ibaba."
    },
    "requirement": {
      "en": "Explore five distinct lower-kudlit written forms.",
      "tl": "Piliin at tuklasin ang 5 magkakaibang simbolong may kudlit sa ibaba."
    },
    "category": "baybayin-discovery",
    "iconKey": "arrow-down-circle-outline",
    "condition": {
      "type": "exploration",
      "group": "lower-kudlit",
      "minimum": 5
    },
    "starValue": 2,
    "proposedStars": 2,
    "sortOrder": 17,
    "availability": "available",
    "definitionVersion": 1
  },
  {
    "id": "kudlit_explorer",
    "catalogNumber": 18,
    "title": {
      "en": "Kudlit Explorer",
      "tl": "Mananaliksik ng Kudlit"
    },
    "description": {
      "en": "Completed both kudlit lessons.",
      "tl": "Tapusin ang lahat ng kinakailangang aralin sa Kudlit."
    },
    "requirement": {
      "en": "Complete both Upper Kudlit and Lower Kudlit instructional topics.",
      "tl": "Tapusin ang lahat ng kinakailangang aralin sa Kudlit."
    },
    "category": "baybayin-discovery",
    "iconKey": "swap-vertical-outline",
    "condition": {
      "type": "module",
      "id": "module-kudlit"
    },
    "starValue": 3,
    "proposedStars": 3,
    "sortOrder": 18,
    "availability": "available",
    "definitionVersion": 1
  },
  {
    "id": "writing_pathfinder",
    "catalogNumber": 19,
    "title": {
      "en": "Writing Pathfinder",
      "tl": "Landas sa Pagsulat"
    },
    "description": {
      "en": "Completed foundational vowel writing.",
      "tl": "Tapusin ang Writing Pathfinder."
    },
    "requirement": {
      "en": "Complete Writing Baybayin — Vowels using its current completion policy.",
      "tl": "Tapusin ang Writing Pathfinder."
    },
    "category": "baybayin-discovery",
    "iconKey": "trail-sign-outline",
    "condition": {
      "type": "topics",
      "ids": [
        "topic-3-1"
      ]
    },
    "starValue": 2,
    "proposedStars": 2,
    "sortOrder": 19,
    "availability": "available",
    "definitionVersion": 1
  },
  {
    "id": "writing_foundation",
    "catalogNumber": 20,
    "title": {
      "en": "Writing Foundation",
      "tl": "Pundasyon sa Pagsulat"
    },
    "description": {
      "en": "Completed foundational consonant writing.",
      "tl": "Tapusin ang Writing Foundation."
    },
    "requirement": {
      "en": "Complete Writing Baybayin — Consonants using its current completion policy.",
      "tl": "Tapusin ang Writing Foundation."
    },
    "category": "baybayin-discovery",
    "iconKey": "journal-outline",
    "condition": {
      "type": "topics",
      "ids": [
        "topic-3-2"
      ]
    },
    "starValue": 3,
    "proposedStars": 3,
    "sortOrder": 20,
    "availability": "available",
    "definitionVersion": 1
  },
  {
    "id": "first_sound",
    "catalogNumber": 21,
    "title": {
      "en": "First Sound",
      "tl": "Unang Tunog"
    },
    "description": {
      "en": "Listened to your first Baybayin pronunciation.",
      "tl": "Patugtugin hanggang matapos ang 1 magkakaibang aprubadong bigkas."
    },
    "requirement": {
      "en": "Play one approved pronunciation recording to completion.",
      "tl": "Patugtugin hanggang matapos ang 1 magkakaibang aprubadong bigkas."
    },
    "category": "listening-matching",
    "iconKey": "volume-high-outline",
    "condition": {
      "type": "metric",
      "metric": "recordings",
      "minimum": 1
    },
    "starValue": 1,
    "proposedStars": 1,
    "sortOrder": 21,
    "availability": "available",
    "definitionVersion": 1
  },
  {
    "id": "sound_collector",
    "catalogNumber": 22,
    "title": {
      "en": "Sound Collector",
      "tl": "Kolektor ng Tunog"
    },
    "description": {
      "en": "Listened to five different recordings.",
      "tl": "Patugtugin hanggang matapos ang 5 magkakaibang aprubadong bigkas."
    },
    "requirement": {
      "en": "Play five distinct approved pronunciation recordings to completion.",
      "tl": "Patugtugin hanggang matapos ang 5 magkakaibang aprubadong bigkas."
    },
    "category": "listening-matching",
    "iconKey": "musical-notes-outline",
    "condition": {
      "type": "metric",
      "metric": "recordings",
      "minimum": 5
    },
    "starValue": 2,
    "proposedStars": 2,
    "sortOrder": 22,
    "availability": "available",
    "definitionVersion": 1
  },
  {
    "id": "listening_legend",
    "catalogNumber": 23,
    "title": {
      "en": "Listening Legend",
      "tl": "Bihasa sa Pakikinig"
    },
    "description": {
      "en": "Listened to 15 different pronunciations.",
      "tl": "Patugtugin hanggang matapos ang 15 magkakaibang aprubadong bigkas."
    },
    "requirement": {
      "en": "Play 15 distinct approved pronunciation recordings to completion.",
      "tl": "Patugtugin hanggang matapos ang 15 magkakaibang aprubadong bigkas."
    },
    "category": "listening-matching",
    "iconKey": "headset-outline",
    "condition": {
      "type": "metric",
      "metric": "recordings",
      "minimum": 15
    },
    "starValue": 3,
    "proposedStars": 3,
    "sortOrder": 23,
    "availability": "available",
    "definitionVersion": 1
  },
  {
    "id": "pair_pioneer",
    "catalogNumber": 24,
    "title": {
      "en": "Pair Pioneer",
      "tl": "Unang Tamang Pares"
    },
    "description": {
      "en": "Made your first correct match.",
      "tl": "Magsumite ng unang tamang pares."
    },
    "requirement": {
      "en": "Submit the first correctly matched, scoreable pair.",
      "tl": "Magsumite ng unang tamang pares."
    },
    "category": "listening-matching",
    "iconKey": "extension-puzzle-outline",
    "condition": {
      "type": "metric",
      "metric": "pairs",
      "minimum": 1
    },
    "starValue": 1,
    "proposedStars": 1,
    "sortOrder": 24,
    "availability": "available",
    "definitionVersion": 1
  },
  {
    "id": "triple_connection",
    "catalogNumber": 25,
    "title": {
      "en": "Triple Connection",
      "tl": "Tatlong Koneksiyon"
    },
    "description": {
      "en": "Correctly matched three pairs in one challenge.",
      "tl": "Itugma nang tama ang tatlong pares sa isang pagsusumite."
    },
    "requirement": {
      "en": "Correctly match at least three scoreable pairs within a single submitted matching board.",
      "tl": "Itugma nang tama ang tatlong pares sa isang pagsusumite."
    },
    "category": "listening-matching",
    "iconKey": "git-network-outline",
    "condition": {
      "type": "metric",
      "metric": "boardCorrect",
      "minimum": 3
    },
    "starValue": 2,
    "proposedStars": 2,
    "sortOrder": 25,
    "availability": "available",
    "definitionVersion": 1
  },
  {
    "id": "sound_sleuth",
    "catalogNumber": 26,
    "title": {
      "en": "Sound Sleuth",
      "tl": "Detektib ng Tunog"
    },
    "description": {
      "en": "Correctly identified five recorded sounds.",
      "tl": "Sagutin nang tama ang 5 magkakaibang tanong na may tunog."
    },
    "requirement": {
      "en": "Correctly complete five distinct audio-to-character source questions.",
      "tl": "Sagutin nang tama ang 5 magkakaibang tanong na may tunog."
    },
    "category": "listening-matching",
    "iconKey": "ear-outline",
    "condition": {
      "type": "metric",
      "metric": "audioQuestions",
      "minimum": 5
    },
    "starValue": 2,
    "proposedStars": 2,
    "sortOrder": 26,
    "availability": "available",
    "definitionVersion": 1
  },
  {
    "id": "sound_scholar",
    "catalogNumber": 27,
    "title": {
      "en": "Sound Scholar",
      "tl": "Iskolar ng Tunog"
    },
    "description": {
      "en": "Correctly identified 15 recorded sounds.",
      "tl": "Sagutin nang tama ang 15 magkakaibang tanong na may tunog."
    },
    "requirement": {
      "en": "Correctly complete 15 distinct audio-to-character source questions.",
      "tl": "Sagutin nang tama ang 15 magkakaibang tanong na may tunog."
    },
    "category": "listening-matching",
    "iconKey": "school-outline",
    "condition": {
      "type": "metric",
      "metric": "audioQuestions",
      "minimum": 15
    },
    "starValue": 4,
    "proposedStars": 4,
    "sortOrder": 27,
    "availability": "available",
    "definitionVersion": 1
  },
  {
    "id": "baybayin_decoder",
    "catalogNumber": 28,
    "title": {
      "en": "Baybayin Decoder",
      "tl": "Tagabasa ng Baybayin"
    },
    "description": {
      "en": "Matched 10 Baybayin characters to Latin readings.",
      "tl": "Itugma nang tama ang 10 magkaibang tanong mula Baybayin sa Latin."
    },
    "requirement": {
      "en": "Correctly complete 10 distinct Baybayin-to-Latin source questions.",
      "tl": "Itugma nang tama ang 10 magkaibang tanong mula Baybayin sa Latin."
    },
    "category": "listening-matching",
    "iconKey": "language-outline",
    "condition": {
      "type": "metric",
      "metric": "decodeQuestions",
      "minimum": 10
    },
    "starValue": 3,
    "proposedStars": 3,
    "sortOrder": 28,
    "availability": "available",
    "definitionVersion": 1
  },
  {
    "id": "symbol_builder",
    "catalogNumber": 29,
    "title": {
      "en": "Symbol Builder",
      "tl": "Tagabuo ng Simbolo"
    },
    "description": {
      "en": "Matched 10 Latin syllables to Baybayin characters.",
      "tl": "Itugma nang tama ang 10 magkaibang tanong mula Latin sa Baybayin."
    },
    "requirement": {
      "en": "Correctly complete 10 distinct Latin-to-Baybayin source questions.",
      "tl": "Itugma nang tama ang 10 magkaibang tanong mula Latin sa Baybayin."
    },
    "category": "listening-matching",
    "iconKey": "construct-outline",
    "condition": {
      "type": "metric",
      "metric": "buildQuestions",
      "minimum": 10
    },
    "starValue": 3,
    "proposedStars": 3,
    "sortOrder": 29,
    "availability": "available",
    "definitionVersion": 1
  },
  {
    "id": "perfect_pairboard",
    "catalogNumber": 30,
    "title": {
      "en": "Perfect Pairboard",
      "tl": "Perpektong Pagtutugma"
    },
    "description": {
      "en": "Completed a matching challenge with every pair correct.",
      "tl": "Itugma nang tama ang lahat ng pares sa isang hamon na may hindi bababa sa tatlong pares."
    },
    "requirement": {
      "en": "Submit a matching board containing at least three scoreable pairs, with every scoreable pair correct.",
      "tl": "Itugma nang tama ang lahat ng pares sa isang hamon na may hindi bababa sa tatlong pares."
    },
    "category": "listening-matching",
    "iconKey": "checkbox-outline",
    "condition": {
      "type": "metric",
      "metric": "perfectBoard",
      "minimum": 1
    },
    "starValue": 3,
    "proposedStars": 3,
    "sortOrder": 30,
    "availability": "available",
    "definitionVersion": 1
  },
  {
    "id": "first_stroke",
    "catalogNumber": 31,
    "title": {
      "en": "First Stroke",
      "tl": "Unang Guhit"
    },
    "description": {
      "en": "Made your first Baybayin handwriting attempt.",
      "tl": "Magsumite ng guhit at hintaying matapos ang pagkilala nito."
    },
    "requirement": {
      "en": "Submit the first valid, nonempty handwriting attempt and receive a completed local recognition result.",
      "tl": "Magsumite ng guhit at hintaying matapos ang pagkilala nito."
    },
    "category": "handwriting",
    "iconKey": "brush-outline",
    "condition": {
      "type": "metric",
      "metric": "writingAttempts",
      "minimum": 1
    },
    "starValue": 1,
    "proposedStars": 1,
    "sortOrder": 31,
    "availability": "available",
    "definitionVersion": 1
  },
  {
    "id": "first_recognition",
    "catalogNumber": 32,
    "title": {
      "en": "First Recognition",
      "tl": "Unang Pagkilala"
    },
    "description": {
      "en": "Successfully wrote your first recognized character.",
      "tl": "Isulat nang tama ang inaasahang simbolo."
    },
    "requirement": {
      "en": "Successfully write one expected character according to the existing target-versus-prediction evaluation.",
      "tl": "Isulat nang tama ang inaasahang simbolo."
    },
    "category": "handwriting",
    "iconKey": "checkmark-circle-outline",
    "condition": {
      "type": "metric",
      "metric": "writingSuccess",
      "minimum": 1
    },
    "starValue": 1,
    "proposedStars": 1,
    "sortOrder": 32,
    "availability": "available",
    "definitionVersion": 1
  },
  {
    "id": "little_writer",
    "catalogNumber": 33,
    "title": {
      "en": "Little Writer",
      "tl": "Batang Manunulat"
    },
    "description": {
      "en": "Correctly completed three writing questions.",
      "tl": "Sagutin nang tama ang 3 magkakaibang tanong sa pagsulat."
    },
    "requirement": {
      "en": "Correctly complete three distinct handwriting assessment questions.",
      "tl": "Sagutin nang tama ang 3 magkakaibang tanong sa pagsulat."
    },
    "category": "handwriting",
    "iconKey": "pencil-outline",
    "condition": {
      "type": "metric",
      "metric": "writingQuestions",
      "minimum": 3
    },
    "starValue": 2,
    "proposedStars": 2,
    "sortOrder": 33,
    "availability": "available",
    "definitionVersion": 1
  },
  {
    "id": "growing_writer",
    "catalogNumber": 34,
    "title": {
      "en": "Growing Writer",
      "tl": "Umuunlad na Manunulat"
    },
    "description": {
      "en": "Correctly completed five writing questions.",
      "tl": "Sagutin nang tama ang 5 magkakaibang tanong sa pagsulat."
    },
    "requirement": {
      "en": "Correctly complete five distinct handwriting assessment questions.",
      "tl": "Sagutin nang tama ang 5 magkakaibang tanong sa pagsulat."
    },
    "category": "handwriting",
    "iconKey": "create-outline",
    "condition": {
      "type": "metric",
      "metric": "writingQuestions",
      "minimum": 5
    },
    "starValue": 2,
    "proposedStars": 2,
    "sortOrder": 34,
    "availability": "available",
    "definitionVersion": 1
  },
  {
    "id": "confident_writer",
    "catalogNumber": 35,
    "title": {
      "en": "Confident Writer",
      "tl": "Tiwalang Manunulat"
    },
    "description": {
      "en": "Correctly completed 10 writing questions.",
      "tl": "Sagutin nang tama ang 10 magkakaibang tanong sa pagsulat."
    },
    "requirement": {
      "en": "Correctly complete 10 distinct handwriting assessment questions.",
      "tl": "Sagutin nang tama ang 10 magkakaibang tanong sa pagsulat."
    },
    "category": "handwriting",
    "iconKey": "shield-checkmark-outline",
    "condition": {
      "type": "metric",
      "metric": "writingQuestions",
      "minimum": 10
    },
    "starValue": 3,
    "proposedStars": 3,
    "sortOrder": 35,
    "availability": "available",
    "definitionVersion": 1
  },
  {
    "id": "master_of_strokes",
    "catalogNumber": 36,
    "title": {
      "en": "Master of Strokes",
      "tl": "Dalubhasa sa Pagguhit"
    },
    "description": {
      "en": "Correctly completed 20 writing questions.",
      "tl": "Sagutin nang tama ang 20 magkakaibang tanong sa pagsulat."
    },
    "requirement": {
      "en": "Correctly complete 20 distinct handwriting assessment questions.",
      "tl": "Sagutin nang tama ang 20 magkakaibang tanong sa pagsulat."
    },
    "category": "handwriting",
    "iconKey": "color-wand-outline",
    "condition": {
      "type": "metric",
      "metric": "writingQuestions",
      "minimum": 20
    },
    "starValue": 4,
    "proposedStars": 4,
    "sortOrder": 36,
    "availability": "available",
    "definitionVersion": 1
  },
  {
    "id": "baybayin_writing_hero",
    "catalogNumber": 37,
    "title": {
      "en": "Baybayin Writing Hero",
      "tl": "Bayani ng Pagsulat"
    },
    "description": {
      "en": "Correctly completed every approved writing question.",
      "tl": "Sagutin nang tama ang 25 magkakaibang tanong sa pagsulat."
    },
    "requirement": {
      "en": "Correctly complete all 25 distinct approved Character Writing source questions across eligible attempts.",
      "tl": "Sagutin nang tama ang 25 magkakaibang tanong sa pagsulat."
    },
    "category": "handwriting",
    "iconKey": "trophy-outline",
    "condition": {
      "type": "metric",
      "metric": "writingQuestions",
      "minimum": 25
    },
    "starValue": 5,
    "proposedStars": 5,
    "sortOrder": 37,
    "availability": "available",
    "definitionVersion": 1
  },
  {
    "id": "base_character_artist",
    "catalogNumber": 38,
    "title": {
      "en": "Base Character Artist",
      "tl": "Alagad ng Batayang Simbolo"
    },
    "description": {
      "en": "Successfully wrote five different base consonants.",
      "tl": "Isulat nang tama ang limang magkakaibang batayang katinig."
    },
    "requirement": {
      "en": "Correctly write five distinct base-consonant assessment targets.",
      "tl": "Isulat nang tama ang limang magkakaibang batayang katinig."
    },
    "category": "handwriting",
    "iconKey": "color-palette-outline",
    "condition": {
      "type": "metric",
      "metric": "baseTargets",
      "minimum": 5
    },
    "starValue": 3,
    "proposedStars": 3,
    "sortOrder": 38,
    "availability": "available",
    "definitionVersion": 1
  },
  {
    "id": "upper_kudlit_artist",
    "catalogNumber": 39,
    "title": {
      "en": "Upper Kudlit Artist",
      "tl": "Alagad ng Kudlit sa Itaas"
    },
    "description": {
      "en": "Successfully wrote three different upper-kudlit forms.",
      "tl": "Isulat nang tama ang tatlong magkakaibang simbolong may kudlit sa itaas."
    },
    "requirement": {
      "en": "Correctly write three distinct upper-kudlit assessment targets.",
      "tl": "Isulat nang tama ang tatlong magkakaibang simbolong may kudlit sa itaas."
    },
    "category": "handwriting",
    "iconKey": "caret-up-circle-outline",
    "condition": {
      "type": "metric",
      "metric": "upperTargets",
      "minimum": 3
    },
    "starValue": 3,
    "proposedStars": 3,
    "sortOrder": 39,
    "availability": "available",
    "definitionVersion": 1
  },
  {
    "id": "lower_kudlit_artist",
    "catalogNumber": 40,
    "title": {
      "en": "Lower Kudlit Artist",
      "tl": "Alagad ng Kudlit sa Ibaba"
    },
    "description": {
      "en": "Successfully wrote three different lower-kudlit forms.",
      "tl": "Isulat nang tama ang tatlong magkakaibang simbolong may kudlit sa ibaba."
    },
    "requirement": {
      "en": "Correctly write three distinct lower-kudlit assessment targets.",
      "tl": "Isulat nang tama ang tatlong magkakaibang simbolong may kudlit sa ibaba."
    },
    "category": "handwriting",
    "iconKey": "caret-down-circle-outline",
    "condition": {
      "type": "metric",
      "metric": "lowerTargets",
      "minimum": 3
    },
    "starValue": 3,
    "proposedStars": 3,
    "sortOrder": 40,
    "availability": "available",
    "definitionVersion": 1
  },
  {
    "id": "checkpoint_clearer",
    "catalogNumber": 41,
    "title": {
      "en": "Checkpoint Clearer",
      "tl": "Unang Pagsasanay"
    },
    "description": {
      "en": "Completed your first learning checkpoint.",
      "tl": "Tapusin ang 1 magkakaibang pagsasanay."
    },
    "requirement": {
      "en": "Complete the first distinct topic-based assessment checkpoint under the existing completion policy.",
      "tl": "Tapusin ang 1 magkakaibang pagsasanay."
    },
    "category": "milestones-adventures",
    "iconKey": "flag-outline",
    "condition": {
      "type": "metric",
      "metric": "checkpoints",
      "minimum": 1
    },
    "starValue": 1,
    "proposedStars": 1,
    "sortOrder": 41,
    "availability": "available",
    "definitionVersion": 1
  },
  {
    "id": "checkpoint_explorer",
    "catalogNumber": 42,
    "title": {
      "en": "Checkpoint Explorer",
      "tl": "Manlalakbay sa Pagsasanay"
    },
    "description": {
      "en": "Completed three different checkpoints.",
      "tl": "Tapusin ang 3 magkakaibang pagsasanay."
    },
    "requirement": {
      "en": "Complete three distinct topic-based assessment checkpoints.",
      "tl": "Tapusin ang 3 magkakaibang pagsasanay."
    },
    "category": "milestones-adventures",
    "iconKey": "map-outline",
    "condition": {
      "type": "metric",
      "metric": "checkpoints",
      "minimum": 3
    },
    "starValue": 3,
    "proposedStars": 3,
    "sortOrder": 42,
    "availability": "available",
    "definitionVersion": 1
  },
  {
    "id": "baybayin_trailblazer",
    "catalogNumber": 43,
    "title": {
      "en": "Baybayin Trailblazer",
      "tl": "Tagapanguna sa Baybayin"
    },
    "description": {
      "en": "Completed all required foundational checkpoints.",
      "tl": "Tapusin ang lahat ng kinakailangang batayang pagsasanay."
    },
    "requirement": {
      "en": "Complete all required assessment checkpoints in the published foundational curriculum version.",
      "tl": "Tapusin ang lahat ng kinakailangang batayang pagsasanay."
    },
    "category": "milestones-adventures",
    "iconKey": "bonfire-outline",
    "condition": {
      "type": "metric",
      "metric": "allCheckpoints",
      "minimum": 1
    },
    "starValue": 5,
    "proposedStars": 5,
    "sortOrder": 43,
    "availability": "available",
    "definitionVersion": 1
  },
  {
    "id": "second_chance_champion",
    "catalogNumber": 44,
    "title": {
      "en": "Second Chance Champion",
      "tl": "Kampeon ng Muling Pagsubok"
    },
    "description": {
      "en": "Finished another attempt of a completed checkpoint.",
      "tl": "Muling simulan at tapusin ang natapos nang pagsasanay."
    },
    "requirement": {
      "en": "Start a new attempt of a previously completed checkpoint and finish that new attempt.",
      "tl": "Muling simulan at tapusin ang natapos nang pagsasanay."
    },
    "category": "milestones-adventures",
    "iconKey": "refresh-circle-outline",
    "condition": {
      "type": "metric",
      "metric": "retry",
      "minimum": 1
    },
    "starValue": 2,
    "proposedStars": 2,
    "sortOrder": 44,
    "availability": "available",
    "definitionVersion": 1
  },
  {
    "id": "practice_makes_progress",
    "catalogNumber": 45,
    "title": {
      "en": "Practice Makes Progress",
      "tl": "Pag-unlad sa Pagsasanay"
    },
    "description": {
      "en": "Improved your result through practice.",
      "tl": "Dagdagan ang tamang sagot sa muling pagsagot sa parehong mga tanong at paraan."
    },
    "requirement": {
      "en": "Improve the number of correct responses on a repeated checkpoint with the same scoreable question set, denominator, and compatible assessment format.",
      "tl": "Dagdagan ang tamang sagot sa muling pagsagot sa parehong mga tanong at paraan."
    },
    "category": "milestones-adventures",
    "iconKey": "stats-chart-outline",
    "condition": {
      "type": "metric",
      "metric": "improvement",
      "minimum": 1
    },
    "starValue": 3,
    "proposedStars": 3,
    "sortOrder": 45,
    "availability": "available",
    "definitionVersion": 1
  },
  {
    "id": "welcome_back_learner",
    "catalogNumber": 46,
    "title": {
      "en": "Welcome Back, Learner!",
      "tl": "Maligayang Pagbabalik!"
    },
    "description": {
      "en": "Returned to finish an unfinished checkpoint.",
      "tl": "Buksan muli ang BAYA at tapusin ang naiwang pagsasanay."
    },
    "requirement": {
      "en": "Resume an unfinished checkpoint after reopening BAYA and subsequently complete that checkpoint.",
      "tl": "Buksan muli ang BAYA at tapusin ang naiwang pagsasanay."
    },
    "category": "milestones-adventures",
    "iconKey": "log-in-outline",
    "condition": {
      "type": "metric",
      "metric": "resume",
      "minimum": 1
    },
    "starValue": 2,
    "proposedStars": 2,
    "sortOrder": 46,
    "availability": "available",
    "definitionVersion": 1
  },
  {
    "id": "baya_story_explorer",
    "catalogNumber": 47,
    "title": {
      "en": "BAYA Story Explorer",
      "tl": "Tuklas sa Kuwento ng BAYA"
    },
    "description": {
      "en": "Discovered the story behind BAYA.",
      "tl": "Tapusin ang limang pahina ng Kuwento ng BAYA."
    },
    "requirement": {
      "en": "Complete all five pages of The Story Behind BAYA using the existing storybook-completion behavior.",
      "tl": "Tapusin ang limang pahina ng Kuwento ng BAYA."
    },
    "category": "milestones-adventures",
    "iconKey": "book-outline",
    "condition": {
      "type": "metric",
      "metric": "story",
      "minimum": 1
    },
    "starValue": 1,
    "proposedStars": 1,
    "sortOrder": 47,
    "availability": "available",
    "definitionVersion": 1
  },
  {
    "id": "story_revisited",
    "catalogNumber": 48,
    "title": {
      "en": "Story Revisited",
      "tl": "Muling Pagbasa"
    },
    "description": {
      "en": "Explored BAYA's story once again.",
      "tl": "Buksan ang kuwento sa Mga Setting at basahing muli ang limang pahina."
    },
    "requirement": {
      "en": "Reopen the storybook through Settings and complete all five pages again during a genuine replay session.",
      "tl": "Buksan ang kuwento sa Mga Setting at basahing muli ang limang pahina."
    },
    "category": "milestones-adventures",
    "iconKey": "repeat-outline",
    "condition": {
      "type": "metric",
      "metric": "replay",
      "minimum": 1
    },
    "starValue": 2,
    "proposedStars": 2,
    "sortOrder": 48,
    "availability": "available",
    "definitionVersion": 1
  },
  {
    "id": "offline_adventurer",
    "catalogNumber": 49,
    "title": {
      "en": "Offline Adventurer",
      "tl": "Manlalakbay na Walang Internet"
    },
    "description": {
      "en": "Completed a learning challenge without internet.",
      "tl": "Tapusin ang pagsasanay nang walang internet kapag handa na ang offline package."
    },
    "requirement": {
      "en": "Complete one scoreable learning checkpoint while the required offline package is ready and the application is operating in an observed offline state.",
      "tl": "Tapusin ang pagsasanay nang walang internet kapag handa na ang offline package."
    },
    "category": "milestones-adventures",
    "iconKey": "cloud-offline-outline",
    "condition": {
      "type": "metric",
      "metric": "offline",
      "minimum": 1
    },
    "starValue": 3,
    "proposedStars": 3,
    "sortOrder": 49,
    "availability": "available",
    "definitionVersion": 1
  },
  {
    "id": "values_hero",
    "catalogNumber": 50,
    "title": {
      "en": "Values Hero",
      "tl": "Bayani ng Pagpapahalaga"
    },
    "description": {
      "en": "Completed a values-integrated learning adventure.",
      "tl": "Tapusin ang isang aprubadong gawain sa pagpapahalaga."
    },
    "requirement": {
      "en": "Successfully complete one approved values-integrated learning activity under its actual completion policy.",
      "tl": "Tapusin ang isang aprubadong gawain sa pagpapahalaga."
    },
    "category": "milestones-adventures",
    "iconKey": "heart-outline",
    "condition": {
      "type": "metric",
      "metric": "values",
      "minimum": 1
    },
    "starValue": 4,
    "proposedStars": 4,
    "sortOrder": 50,
    "availability": "coming-soon",
    "definitionVersion": 1
  }
];
