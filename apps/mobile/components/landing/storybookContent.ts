import type { Language } from '../../localization/core';

export type OriginPage = {
  id: string; title: string; subtitle: string; paragraphs: readonly string[];
  visual: 'mascot' | 'learning' | 'characters'; caption: string;
};
const mascotCaption = "Bayani — BAYA’s Philippine eagle-inspired learning companion.";
export const storybookCopy = {
  en: {
    title: 'The Story Behind BAYA', invitation: 'Meet Bayani and discover the people, culture, and inspiration behind our learning journey.',
    open: 'Read the story', close: 'Close the story', previous: 'Previous', next: 'Next', finish: 'Finish Reading',
    page: (n: number) => `Page ${n} of 5`, chapter: 'OUR LEARNING JOURNEY',
    mascotAlt: 'Bayani, a friendly eagle wearing glasses and a woven hat.',
    art: 'Artwork: existing BAYA mascot asset. Illustrator not documented.',
    glyphCredit: 'Character artwork: BAYA’s bundled Gavino learning assets.',
    guidance: 'Educational Content and Cultural Guidance', thanks: 'Special Thanks',
    support: 'For guidance and support in the development and review of BAYA’s educational content.',
    closing: 'Our Baybayin journey is just beginning!',
  },
  tl: {
    title: 'Ang Kuwento sa Likod ng BAYA', invitation: 'Kilalanin si Bayani at tuklasin ang mga tao, kultura, at inspirasyon sa ating paglalakbay sa pagkatuto.',
    open: 'Basahin ang kuwento', close: 'Isara ang kuwento', previous: 'Bumalik', next: 'Susunod', finish: 'Tapusin ang Pagbasa',
    page: (n: number) => `Pahina ${n} ng 5`, chapter: 'ANG ATING PAGLALAKBAY',
    mascotAlt: 'Si Bayani, isang magiliw na agilang may salamin at salakot.',
    art: 'Larawan: kasalukuyang maskot ng BAYA. Walang nakatalang ilustrador.',
    glyphCredit: 'Mga larawan ng titik: nakapaloob na Gavino learning assets ng BAYA.',
    guidance: 'Gabay sa Nilalamang Pang-edukasyon at Kultura', thanks: 'Natatanging Pasasalamat',
    support: 'Para sa paggabay at suporta sa pagbuo at pagsusuri ng nilalamang pang-edukasyon ng BAYA.',
    closing: 'Nagsisimula pa lamang ang ating paglalakbay sa Baybayin!',
  },
} satisfies Record<Language, object>;
export const storybookPages: Record<Language, readonly OriginPage[]> = {
  en: [
    { id: 'meet', title: 'Meet Bayani!', subtitle: 'Your Friendly Learning Companion', visual: 'mascot', caption: mascotCaption, paragraphs: [
      'Mabuhay! Meet Bayani, your friendly learning companion!',
      'With a curious mind and a cheerful spirit, Bayani loves discovering new things and helping young learners explore Filipino culture.',
      'Together, you will discover Baybayin characters, practice writing, and learn something exciting with every step!',
    ] },
    { id: 'inspiration', title: 'The Story Behind Bayani', subtitle: 'Inspired by the Philippine Eagle', visual: 'mascot', caption: mascotCaption, paragraphs: [
      'Have you ever seen a Philippine eagle? With its magnificent appearance and powerful wings, this special bird reminds us of the beauty of our natural heritage.',
      'The project’s naming story begins with a real Philippine eagle named Bayani. Inspired by this eagle, the researchers shortened the name to BAYA for the learning application.',
      'The real eagle and our illustrated companion are different. Here, Bayani has a special mission: to help young learners discover the beauty of Baybayin!',
    ] },
    { id: 'baya', title: 'The Story of BAYA', subtitle: 'Learning Baybayin, One Character at a Time', visual: 'learning', caption: 'Discover. Practice. Grow with Bayani.', paragraphs: [
      'Every great learning journey begins with a little curiosity. BAYA was created to help young learners discover Baybayin in a fun, interactive, and meaningful way.',
      'Through guided lessons, handwriting practice, quizzes, and engaging activities, learners explore traditional characters and build confidence.',
      'And throughout this journey, Bayani is here to encourage you to keep discovering, practicing, and growing!',
    ] },
    { id: 'baybayin', title: 'Discovering Baybayin', subtitle: 'A Beautiful Part of Our Filipino Heritage', visual: 'characters', caption: 'A · Ba · Ka · Ma — four characters to discover.', paragraphs: [
      'Long before the writing system we commonly use today, people in parts of the Philippines used traditional scripts such as Baybayin.',
      'Baybayin has characters that represent syllables. A mark called a kudlit above a consonant changes its vowel to e or i; below, it changes the vowel to o or u.',
      'By learning Baybayin, we can discover another way our ancestors expressed language. Every character has something new to teach us. Are you ready to discover them with Bayani?',
    ] },
    { id: 'thanks', title: 'A Journey Made Possible Together', subtitle: 'With Gratitude and Appreciation', visual: 'mascot', caption: mascotCaption, paragraphs: [
      'Every meaningful learning journey is made more special by people who share their knowledge and inspire others.',
      'The BAYA team thanks Buhayin Baybayin and Ginhawa Baybayin Creativity Workshops for their contribution to the appreciation and promotion of Baybayin.',
      'We extend our special thanks to Ma’am Mini Gavino for her valuable guidance, knowledge, and support in developing and reviewing BAYA’s educational content. Maraming salamat po!',
    ] },
  ],
  tl: [
    { id: 'meet', title: 'Kilalanin si Bayani!', subtitle: 'Ang Iyong Kaibigan sa Pagkatuto', visual: 'mascot', caption: 'Bayani — ang kaibigan sa pagkatuto ng BAYA na hango sa agilang Pilipino.', paragraphs: [
      'Mabuhay! Kilalanin si Bayani, ang iyong kaibigan sa pagkatuto!',
      'Mausisa at masayahin si Bayani. Mahilig siyang tumuklas ng mga bagong bagay at tumulong sa mga batang matuto tungkol sa kulturang Pilipino.',
      'Sama-sama nating tuklasin ang mga titik ng Baybayin, magsanay sa pagsulat, at matuto sa bawat hakbang!',
    ] },
    { id: 'inspiration', title: 'Ang Kuwento ni Bayani', subtitle: 'Hango sa Agilang Pilipino', visual: 'mascot', caption: 'Ang ating maskot ay hango sa agilang Pilipino.', paragraphs: [
      'Nakakita ka na ba ng agilang Pilipino? Ang maringal nitong anyo at malalakas na pakpak ay nagpapaalala sa ganda ng ating likas na pamana.',
      'Nagsimula ang pangalan ng proyekto sa isang tunay na agilang Pilipino na nagngangalang Bayani. Ginawang BAYA ng mga mananaliksik ang pinaikling pangalan para sa application.',
      'Magkaiba ang tunay na agila at ang ating iginuhit na kaibigan. Dito, may mahalagang misyon si Bayani: samahan ang mga bata sa pagtuklas ng ganda ng Baybayin!',
    ] },
    { id: 'baya', title: 'Ang Kuwento ng BAYA', subtitle: 'Pag-aaral ng Baybayin, Paisa-isang Titik', visual: 'learning', caption: 'Tumuklas. Magsanay. Matuto kasama si Bayani.', paragraphs: [
      'Nagsisimula sa pagkamausisa ang bawat paglalakbay sa pagkatuto. Nilikha ang BAYA upang maging masaya, interaktibo, at makabuluhan ang pagtuklas ng Baybayin.',
      'Sa mga aralin, pagsasanay sa pagsulat, pagsusulit, at gawain, natutuklasan ng mga bata ang mga tradisyonal na titik at lumalakas ang kanilang tiwala sa sarili.',
      'Kasama mo si Bayani upang hikayatin kang patuloy na tumuklas, magsanay, at matuto!',
    ] },
    { id: 'baybayin', title: 'Tuklasin ang Baybayin', subtitle: 'Magandang Bahagi ng Ating Pamanang Pilipino', visual: 'characters', caption: 'A · Ba · Ka · Ma — apat na titik na matutuklasan.', paragraphs: [
      'Bago pa ang pagsulat na karaniwan nating gamit ngayon, gumamit ang mga tao sa ilang bahagi ng Pilipinas ng mga tradisyonal na sistema tulad ng Baybayin.',
      'Kumakatawan sa mga pantig ang mga titik nito. Ang kudlit sa itaas ng katinig ay nagpapalit ng patinig sa e o i; sa ibaba naman, sa o o u.',
      'Sa pag-aaral ng Baybayin, nakikilala natin ang isang paraan ng pagpapahayag ng ating mga ninuno. Handa ka na bang tumuklas kasama si Bayani?',
    ] },
    { id: 'thanks', title: 'Isang Paglalakbay na Binuo Nang Sama-sama', subtitle: 'May Pasasalamat at Pagpapahalaga', visual: 'mascot', caption: 'Bayani — ang ating kaibigan sa pagkatuto.', paragraphs: [
      'Mas nagiging makabuluhan ang pagkatuto dahil sa mga taong nagbabahagi ng kaalaman at inspirasyon.',
      'Nagpapasalamat ang pangkat ng BAYA sa Buhayin Baybayin at Ginhawa Baybayin Creativity Workshops para sa kanilang ambag sa pagpapahalaga at pagtataguyod ng Baybayin.',
      'Natatanging pasasalamat kay Ma’am Mini Gavino sa kaniyang paggabay, kaalaman, at suporta sa pagbuo at pagsusuri ng nilalamang pang-edukasyon ng BAYA. Maraming salamat po!',
    ] },
  ],
};
