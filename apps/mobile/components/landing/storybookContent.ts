import type { Language } from '../../localization/core';

export type OriginPage = {
  id: string; title: string; subtitle: string; paragraphs: readonly string[];
  source?: { name: string; url: string };
  visual: 'mascot' | 'eagle' | 'learning' | 'characters' | 'gratitude'; caption: string;
};
const mascotCaption = "Bayani — BAYA’s illustrated learning companion.";
export const storybookCopy = {
  en: {
    title: 'The Story Behind BAYA', invitation: 'Meet Bayani and discover the people, culture, and inspiration behind our learning journey.',
    open: 'Read the story', close: 'Close the story', previous: 'Previous', next: 'Next', finish: 'Finish Reading',
    page: (n: number) => `Page ${n} of 5`, chapter: 'OUR LEARNING JOURNEY',
    mascotAlt: 'Bayani, a friendly eagle wearing glasses and a woven hat.',
    art: '',
    viewEagle: 'Read Bayani’s Story', photoIntro: 'Meet the eagle behind the name',
    photoHint: 'See Bayani’s photograph on the Philippine Eagle Foundation website.',
    online: 'Opens an external website • Internet needed', source: 'Source', historicalSource: 'Historical source', artwork: 'Artwork', educationalMaterials: 'Educational materials', portraitAlt: 'Ms. Mini Gavino',
    artworkAlts: ['Eagle close-up with stylized Baybayin lettering, supplied for Buhayin Baybayin.', 'Colorful circular artwork with stars, leaves, flowers and flowing water, supplied for GINHAWA Baybayin Creativity Workshops.'],
    linkError: 'The website could not open. Please try again when online.',
    imageError: 'The illustration could not load.',
    photoAlt: 'Photographic collage supplied for Bayani’s story: a downy eagle chick in front of two other eagle photographs.',
    learningSteps: ['Discover', 'Learn', 'Practice', 'Grow'],
    learningHints: ['Meet a character', 'Listen to its sound', 'Try writing it', 'Keep exploring'],
    kudlit: ['No kudlit', 'Kudlit above', 'Kudlit below'],
    guideCredit: 'Lessons and topics: Baybayin Buhayin',
    gratitude: 'Maraming salamat po!', gratitudeHint: 'Learning grows when we share.',
    glyphCredit: 'Fonts and art assets: Ms. Mini Gavino',
    guidance: 'Educational Content and Cultural Guidance', thanks: 'Special Thanks',
    support: 'For guidance and support in the development and review of BAYA’s educational content.',
    closing: 'Our Baybayin journey is just beginning!',
  },
  tl: {
    title: 'Ang Kuwento sa Likod ng BAYA', invitation: 'Kilalanin si Bayani at tuklasin ang mga tao, kultura, at inspirasyon sa ating paglalakbay sa pagkatuto.',
    open: 'Basahin ang kuwento', close: 'Isara ang kuwento', previous: 'Bumalik', next: 'Susunod', finish: 'Tapusin ang Pagbasa',
    page: (n: number) => `Pahina ${n} ng 5`, chapter: 'ANG ATING PAGLALAKBAY',
    mascotAlt: 'Si Bayani, isang magiliw na agilang may salamin at salakot.',
    art: '',
    viewEagle: 'Basahin ang Kuwento ni Bayani', photoIntro: 'Ang agila sa likod ng pangalan',
    photoHint: 'Tingnan ang larawan ni Bayani sa website ng Philippine Eagle Foundation.',
    online: 'Bubukas ang ibang website • Kailangan ng internet', source: 'Sanggunian (reference)', historicalSource: 'Sanggunian (reference) ng kasaysayan', artwork: 'Larawang-sining', educationalMaterials: 'Mga kagamitang pang-edukasyon', portraitAlt: 'Ms. Mini Gavino',
    artworkAlts: ['Malapitang larawan ng agila na may Baybayin, ibinigay para sa Buhayin Baybayin.', 'Makulay na bilog na sining (art) na may mga bituin, dahon, bulaklak at tubig, ibinigay para sa GINHAWA Baybayin Creativity Workshops.'],
    linkError: 'Hindi mabuksan ang website. Subukan muli kapag may internet.',
    imageError: 'Hindi lumabas ang larawan.',
    photoAlt: 'Pinagsamang mga larawan para sa kuwento ni Bayani: isang sisiw ng agila sa harap ng dalawa pang larawan ng agila.',
    learningSteps: ['Tumuklas', 'Matuto', 'Magsanay', 'Lumago'],
    learningHints: ['Kilalanin ang titik', 'Pakinggan ang tunog', 'Subukang isulat', 'Patuloy na tumuklas'],
    kudlit: ['Walang kudlit (vowel mark)', 'Kudlit (vowel mark) sa itaas', 'Kudlit (vowel mark) sa ibaba'],
    guideCredit: 'Mga aralin at paksa: Baybayin Buhayin',
    gratitude: 'Maraming salamat po!', gratitudeHint: 'Lumalago ang kaalaman sa pagbabahagi.',
    glyphCredit: 'Mga font at larawang-sining: Ms. Mini Gavino',
    guidance: 'Gabay sa Nilalamang Pang-edukasyon at Kultura', thanks: 'Natatanging Pasasalamat',
    support: 'Para sa paggabay at suporta sa pagbuo at pagsusuri ng nilalamang pang-edukasyon ng BAYA.',
    closing: 'Nagsisimula pa lamang ang ating paglalakbay sa Baybayin!',
  },
} satisfies Record<Language, object>;
export const storybookPages: Record<Language, readonly OriginPage[]> = {
  en: [
    { id: 'meet', title: 'Meet BAYA!', subtitle: 'Your Baybayin Learning Adventure Begins Here', visual: 'mascot', caption: mascotCaption, paragraphs: [
      'Mabuhay! Welcome to BAYA! Are you ready to discover Baybayin?',
      'Meet Bayani, your friendly learning companion! Curious and cheerful, Bayani joins you through lessons, writing activities, and new discoveries.',
      'Together, you will explore Baybayin characters, practice writing, and learn about our Filipino heritage. Come along—our learning adventure is about to begin!',
    ] },
    { id: 'inspiration', title: 'The Story Behind Bayani', subtitle: 'Meet the Real Philippine Eagle Who Inspired BAYA', visual: 'eagle', caption: 'Bayani — Philippine Eagle Chick No. 32', paragraphs: [
      'Our illustrated companion was inspired by a real Philippine eagle named Bayani. This chick hatched on December 5, 2025, at the National Bird Breeding Sanctuary in Davao City. Bayani means “hero” in Filipino.',
      'His mother is Dakila and his father is Sinag. His grandmother, LDI, was rescued years ago. Bayani’s birth is a hopeful step in the Philippine Eagle Foundation’s work to protect these critically endangered birds—birds at great risk of disappearing.',
      'Inspired by his story, the researchers shortened Bayani to BAYA for this learning app. Our illustrated Bayani now joins you on a different adventure: discovering Baybayin!',
    ] },
    { id: 'baya', title: 'The Story of BAYA', subtitle: 'Learning Baybayin, One Character at a Time', visual: 'learning', caption: '', paragraphs: [
      'Every great learning journey begins with a little curiosity. BAYA was created to help young learners discover Baybayin in a fun, interactive, and meaningful way.',
      'Through guided lessons, handwriting practice, quizzes, and engaging activities, learners explore characters and try what they have learned.',
      'And throughout this journey, Bayani is here to encourage you to keep discovering, practicing, and growing!',
    ] },
    { id: 'baybayin', title: 'Discovering Baybayin', subtitle: 'A Beautiful Part of Our Filipino Heritage', visual: 'characters', caption: '', paragraphs: [
      'Now let’s meet the writing system at the heart of our journey. Baybayin is one of the traditional scripts used in parts of the Philippines.',
      'Many characters represent syllables. Ba has an a sound. A mark called a kudlit above a consonant changes its vowel to e or i; below, it changes the vowel to o or u.',
      'By learning Baybayin, we can discover another way our ancestors expressed language. Every character has something new to teach us. Are you ready to discover them with Bayani?',
    ] },
    { id: 'thanks', title: 'A Journey Made Possible Together', subtitle: 'With Gratitude and Appreciation', visual: 'gratitude', caption: 'For everyone who shares the gift of learning.', paragraphs: [
      'Every meaningful learning journey is made more special by people who share their knowledge and inspire others.',
      'The BAYA team thanks Buhayin Baybayin and Ginhawa Baybayin Creativity Workshops for their contribution to the appreciation and promotion of Baybayin.',
      'We extend our special thanks to Ma’am Mini Gavino for her valuable guidance, knowledge, and support in developing and reviewing BAYA’s educational content. Maraming salamat po!',
    ] },
  ],
  tl: [
    { id: 'meet', title: 'Kilalanin ang BAYA!', subtitle: 'Dito Nagsisimula ang Iyong Pag-aaral ng Baybayin', visual: 'mascot', caption: 'Bayani — ang kaibigan sa pagkatuto ng BAYA na hango sa agilang Pilipino.', paragraphs: [
      'Mabuhay! Maligayang pagdating sa BAYA! Handa ka na bang tuklasin ang Baybayin?',
      'Kilalanin si Bayani, ang iyong kaibigan sa pagkatuto! Mausisa (curious) at masayahin siya. Sasamahan ka niya sa mga aralin, pagsasanay sa pagsulat, at bagong pagtuklas.',
      'Sama-sama nating tuklasin ang mga titik ng Baybayin, magsanay sa pagsulat, at kilalanin ang ating pamanang (heritage) Pilipino. Halika na—magsisimula na ang ating paglalakbay!',
    ] },
    { id: 'inspiration', title: 'Ang Kuwento ni Bayani', subtitle: 'Kilalanin ang Tunay na Agilang Pilipino na Nagbigay-Inspirasyon sa BAYA', visual: 'eagle', caption: 'Bayani — Philippine Eagle Chick No. 32', paragraphs: [
      'Isang tunay na agilang Pilipino na si Bayani ang inspirasyon ng ating iginuhit na kaibigan. Napisa siya noong Disyembre 5, 2025, sa National Bird Breeding Sanctuary sa Davao City. Ang kaniyang pangalan ay nangangahulugang “bayani.”',
      'Si Dakila ang kaniyang ina at si Sinag ang kaniyang ama. Ang lola niyang si LDI ay nasagip maraming taon na ang nakalipas. Ang pagsilang ni Bayani ay nagbibigay ng pag-asa sa Philippine Eagle Foundation sa pangangalaga sa mga agilang nanganganib nang tuluyang mawala.',
      'Dahil sa kaniyang kuwento, pinaikli ng mga mananaliksik (researchers) ang Bayani bilang BAYA para sa app na ito. Kasama mo naman ang ating iginuhit na Bayani sa pagtuklas ng Baybayin!',
    ] },
    { id: 'baya', title: 'Ang Kuwento ng BAYA', subtitle: 'Pag-aaral ng Baybayin, Paisa-isang Titik', visual: 'learning', caption: '', paragraphs: [
      'Nagsisimula sa pagkamausisa (curiosity) ang bawat paglalakbay sa pagkatuto. Nilikha ang BAYA upang maging masaya, interaktibo, at makabuluhan ang pagtuklas ng Baybayin.',
      'Sa mga aralin, pagsasanay sa pagsulat, pagsusulit, at gawain, natutuklasan ng mga bata ang mga titik at nasusubukan ang kanilang natutuhan.',
      'Kasama mo si Bayani upang hikayatin kang patuloy na tumuklas, magsanay, at matuto!',
    ] },
    { id: 'baybayin', title: 'Tuklasin ang Baybayin', subtitle: 'Magandang Bahagi ng Ating Pamanang (heritage) Pilipino', visual: 'characters', caption: '', paragraphs: [
      'Kilalanin naman natin ang Baybayin, ang paksa ng ating paglalakbay. Isa ito sa mga tradisyonal na paraan ng pagsulat sa ilang bahagi ng Pilipinas.',
      'Maraming titik nito ang kumakatawan sa pantig (syllable). May tunog na a ang Ba. Ang kudlit (vowel mark) sa itaas ng katinig (consonant) ay nagpapalit ng patinig (vowel) sa e o i; sa ibaba naman, sa o o u.',
      'Sa pag-aaral ng Baybayin, nakikilala natin ang isang paraan ng pagpapahayag (expression) ng ating mga ninuno (ancestors). Handa ka na bang tumuklas kasama si Bayani?',
    ] },
    { id: 'thanks', title: 'Isang Paglalakbay na Binuo Nang Sama-sama', subtitle: 'May Pasasalamat at Pagpapahalaga', visual: 'gratitude', caption: 'Para sa lahat ng nagbabahagi ng kaalaman.', paragraphs: [
      'Mas nagiging makabuluhan ang pagkatuto dahil sa mga taong nagbabahagi ng kaalaman at inspirasyon.',
      'Nagpapasalamat ang pangkat ng BAYA sa Buhayin Baybayin at Ginhawa Baybayin Creativity Workshops para sa kanilang ambag sa pagpapahalaga at pagtataguyod (promotion) ng Baybayin.',
      'Natatanging pasasalamat kay Ma’am Mini Gavino sa kaniyang paggabay, kaalaman, at suporta sa pagbuo at pagsusuri ng nilalamang pang-edukasyon ng BAYA. Maraming salamat po!',
    ] },
  ],
};
