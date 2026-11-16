import { getApprovedStorybookActivities } from '../approvedStorybook';
import { topic11ActivityData } from '../topics/topic-1-1';
import { topic12ActivityData } from '../topics/topic-1-2';
import type { SlideStepContent } from '../types';
import { translateText } from '../../localization/core';
import { storyParagraphs, storyTextSegments } from '../../components/learner/story/storyText';

const activities = getApprovedStorybookActivities();
const body = (index: number) => activities[index].steps[0].content as SlideStepContent;
const glyphs = (text: string) => text.match(/[\u1700-\u171f]/gu) ?? [];

describe('Module 1 content compliance', () => {
  it('retains the five stable topic and story identifiers in order with nonblank content', () => {
    expect(activities.map(a => a.id)).toEqual([1, 2, 3, 4, 5].map(n => `topic-1-${n}`));
    for (const activity of activities) {
      expect(activity.steps.map(s => s.id)).toEqual([`${activity.id}-story`]);
      expect(activity.totalActivitiesInModule).toBe(5);
      expect((activity.steps[0].content as SlideStepContent).content.trim()).not.toBe('');
    }
    expect(topic11ActivityData.totalActivitiesInModule).toBe(5);
    expect(topic12ActivityData.title).toBe(activities[1].title);
  });

  it.each([2, 3, 4])('translates complete two-paragraph messages for topic index %s before rendering', index => {
    const source = body(index).content;
    const english = storyParagraphs(source, text => translateText('en', text));
    const tagalog = storyParagraphs(source, text => translateText('tl', text));
    expect(english).toHaveLength(2);
    expect(tagalog).toHaveLength(2);
    expect(english.join(' ')).not.toEqual(tagalog.join(' '));
    expect(english[0]).not.toBe(source.split('\n\n')[0]);
    expect(glyphs(english.join(' '))).toEqual(glyphs(source));
    expect(glyphs(tagalog.join(' '))).toEqual(glyphs(source));
  });

  it('preserves the validated basic glyph and syllable pairs without combining signs', () => {
    expect(body(1).examples).toBe('ᜊ = Ba\nᜃ = Ka\nᜆ = Ta');
    expect(glyphs(body(3).content)).toEqual(['\u1701', '\u1702']);
    expect(glyphs(body(4).content)).toEqual(['\u1707']);
  });

  it('narrows the base-set takeaway in both languages and corrects the legacy writing-tool claim', () => {
    expect(body(2).storyMessage).toBe('Magsimula tayo sa 17 payak na simbolo!');
    expect(translateText('en', body(2).storyMessage!)).toBe('Let’s start with the 17 basic characters!');
    const preview = JSON.stringify(topic11ActivityData);
    expect(preview).not.toContain('sipol');
    expect(preview).not.toContain('Dahil wala pang papel noon');
    expect(preview).toContain('pangkulay');
  });

  it('supports older paragraph-level resources', () => {
    expect(storyParagraphs('Una\n\nIkalawa', text => ({ Una: 'First', Ikalawa: 'Second' })[text] ?? text))
      .toEqual(['First', 'Second']);
  });

  it('highlights complete accented words, glyphs and parenthesized counts without changing text', () => {
    const text = 'baybáy: labimpitong (17), ᜁ. D remains inside Did.';
    const segments = storyTextSegments(text, ['17', 'labimpitong (17)', 'baybáy', 'ᜁ', 'D']);
    expect(segments.map(s => s.text).join('')).toBe(text);
    expect(segments.filter(s => s.highlighted).map(s => s.text)).toEqual(['baybáy', 'labimpitong (17)', 'ᜁ', 'D']);
  });
});
