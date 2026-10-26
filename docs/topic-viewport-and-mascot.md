# Topic viewport and mascot interaction — 19 October 2026

## Audit before implementation

- `StorybookTopicLayout` reserves 42% for the illustration even when it is an empty placeholder. It measures width and image dimensions but does not use the available page height to choose a reading layout.
- `StoryContent` permanently places `StoryGuide` below its text ScrollView. The guide has an 80 px minimum bubble height and a mascot scaled by 1.4, reducing the reading viewport by roughly 100 px on short phones.
- Topic 1-2 repeats its title in the header and body; examples have fixed 30 px type / 44 px line height plus 32 px vertical margins, using over 180 px alone. The two full paragraphs consequently require scrolling.
- The header is already 52 px on landscape phones. The footer is already separate from the content, but its 5 px top/bottom padding can be reduced while retaining a 44 px minimum target.
- The illustration frame already preserves aspect ratio. Placeholder minimums are not the primary problem; column allocation is.
- Topic 1-2 has two paragraphs plus three examples; 1-4 and 1-5 have a lead and two paragraphs. Shorter topics should not dictate a fixed text height for these longer lessons.
- Character topics share the layout and speech styling. Changes must opt into the story layout so their pronunciation and symbol selection remain intact.
