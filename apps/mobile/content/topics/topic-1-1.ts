import type {
  ActivityStep,
  SlideItem,
  SlideStepContent,
  TopicActivityData,
  VideoSource,
  VideoStepContent,
} from "../types";

export const baybayinSongVideoSource: VideoSource = {
  type: "asset",
  assetId: "baybayin-song",
};
export const baybayinSongAsset = baybayinSongVideoSource;

/**
 * Approved 5 sequential learning steps for Topic 1.1:
 * STEP 1: Video (Panimulang Video)
 * STEP 2: Slide 1 (Pinagmulan ng Baybayin)
 * STEP 3: Slide 2 (Paano ginagamit)
 * STEP 4: Slide 3 (Bakit mahalaga)
 * STEP 5: Slide 4 (Handa ka na bang matuto?)
 */
export const topic11Steps: ActivityStep[] = [
  {
    id: "topic-1-1-step-1",
    type: "video",
    title: "Ang Kuwento ng Baybayin",
    requiresCompletion: true,
    ctaLabel: "Susunod",
    content: {
      badge: "PANOORIN",
      title: "Ang Kuwento ng Baybayin",
      durationText: "2:15",
      source: baybayinSongVideoSource,
      metadata: {
        originalFilename: "Baybayin Song 1 V2 Gavino (c)2021.mp4",
      },
      isAvailable: true,
    } satisfies VideoStepContent,
  },
  {
    id: "topic-1-1-step-2",
    type: "slide",
    title: "Ang Pinagmulan ng Baybayin",
    ctaLabel: "Susunod na Slide",
    content: {
      badge: "KASAYSAYAN AT KAHALAGAHAN",
      number: 1,
      totalInDeck: 4,
      title: "Ang Pinagmulan ng Baybayin",
      subtitle: "Tara, balikan natin ang pinagmulan ng Baybayin.",
      openingNarration: "Tara at balikan natin kung saan nagmula ang Baybayin.",
      content:
        "Bago pa man dumating ang mga Kastila, may sarili nang sistema ng pagsusulat ang mga Pilipino.\n\nDahil wala pang papel noon, sa mga puno, kawayan, at dahon sila umuukit gamit ang matutulis na bagay para magsulat ng mga tula at mensahe.",
      storyHighlight: "May sarili tayong paraan ng pagsulat — ang Baybayin.",
      storyMessage: "Ito ay mahalagang bahagi ng pagkatao natin.",
      highlightWords: [
        "Baybayin",
        "Pilipino",
        "Kastila",
        "pagsusulat",
        "kultura",
        "kawayan",
        "dahon",
        "puno",
        "papel",
        "pagkatao",
      ],
      illustrationPlaceholder: "Ang Pinagmulan ng Baybayin",
      illustrationTheme: "origin",
    } satisfies SlideStepContent,
  },
  {
    id: "topic-1-1-step-3",
    type: "slide",
    title: "Paano ginagamit ang Baybayin?",
    ctaLabel: "Susunod na Slide",
    content: {
      badge: "KASAYSAYAN AT KAHALAGAHAN",
      number: 2,
      totalInDeck: 4,
      title: "Paano ginagamit ang Baybayin?",
      subtitle: "Mga Sinaunang Kagamitan sa Pagsulat",
      openingNarration: "Alamin natin kung paano sumulat ang ating mga ninuno.",
      content:
        "Dahil wala pang papel noon, sa mga puno, kawayan, at dahon sila umuukit gamit ang matutulis na bagay para magsulat ng mga tula at mensahe.",
      storyHighlight:
        "Umuukit gamit ang sipol sa mga biyas ng kawayan at dahon.",
      storyMessage:
        "Ginagamit ang Baybayin sa pagpapadala ng liham, tula, at mensahe ng pakikipagkapwa.",
      highlightWords: [
        "Baybayin",
        "pagsusulat",
        "kawayan",
        "dahon",
        "puno",
        "papel",
        "sipol",
        "tula",
        "mensahe",
      ],
      illustrationPlaceholder: "Pagsulat sa Dahon at Kawayan",
      illustrationTheme: "tools",
    } satisfies SlideStepContent,
  },
  {
    id: "topic-1-1-step-4",
    type: "slide",
    title: "Bakit mahalaga ang Baybayin?",
    ctaLabel: "Susunod na Slide",
    content: {
      badge: "KASAYSAYAN AT KAHALAGAHAN",
      number: 3,
      totalInDeck: 4,
      title: "Bakit mahalaga ang Baybayin?",
      subtitle: "Ang Ating Pamana at Pagkakakilanlan",
      openingNarration: "Mahalaga ang Baybayin sa ating pagiging Pilipino.",
      content:
        "Ang Baybayin ay mahalagang bahagi ng ating pagkatao, kultura, at pamana bilang mga Pilipino.",
      storyHighlight: "Buhay ang ating kultura sa bawat titik ng Baybayin.",
      storyMessage:
        "Ito ay salamin ng ating mayamang kasaysayan bago pa dumating ang mga banyaga.",
      highlightWords: ["Baybayin", "pagkatao", "kultura", "pamana", "Pilipino"],
      illustrationPlaceholder: "Pamanang Kultural ng Pilipino",
      illustrationTheme: "identity",
    } satisfies SlideStepContent,
  },
  {
    id: "topic-1-1-step-5",
    type: "slide",
    title: "Handa ka na bang matuto?",
    ctaLabel: "Tapusin ang Aralin",
    content: {
      badge: "KASAYSAYAN AT KAHALAGAHAN",
      number: 4,
      totalInDeck: 4,
      title: "Handa ka na bang matuto?",
      subtitle: "Simulan ang Paglalakbay sa Pagsusulat",
      openingNarration: "Nakahanda ka na bang buksan ang bagong aralin?",
      content:
        "Panoorin at unawain ang Baybayin bago tayo magsimula sa mga titik at tunog.",
      storyHighlight:
        "Magkasama nating tuklasin ang sining ng ating mga ninuno!",
      storyMessage: "Handa na si Baya na samahan ka sa iyong pagkatuto.",
      highlightWords: ["Baybayin", "titik", "tunog", "Baya"],
      illustrationPlaceholder: "Simula ng Pag-aaral",
      illustrationTheme: "practice",
    } satisfies SlideStepContent,
  },
];

/**
 * Existing activity preview data for Module 1 Topic 1.1.
 * Purely data-driven with no hardcoded presentation paragraphs.
 */
export const topic11Slides: SlideItem[] = topic11Steps
  .filter((step) => step.type === "slide")
  .map((step) => ({ ...(step.content as SlideStepContent), id: step.id }));

export const topic11ActivityData: TopicActivityData = {
  id: "topic-1-1",
  moduleId: "module-1",
  moduleTitle: "What is Baybayin?",
  title: "Kasaysayan at Kahalagahan ng Baybayin",
  type: "video",
  activityIndex: 1,
  totalActivitiesInModule: 3,
  steps: topic11Steps,
  video: {
    title: "Ang Kuwento ng Baybayin",
    source: baybayinSongVideoSource,
    metadata: {
      originalFilename: "Baybayin Song 1 V2 Gavino (c)2021.mp4",
    },
    durationText: "2:15",
    isAvailable: true,
  },
  slides: topic11Slides,
};
