// Utility functions for analyzing text readability and generating Hemingway-style highlights

// Matches sentences ending with period, question mark, or exclamation point followed by space
const sentenceRegex = /[^.!?]+[.!?]\s+/g;

// Matches words (including hyphenated words)
const wordRegex = /\b[\w\-]+\b/g;

// Enhanced word lists for better classification
const weakeningAdverbs = [
  'very', 'really', 'quite', 'rather', 'somewhat', 'definitely', 'certainly', 
  'probably', 'actually', 'basically', 'virtually', 'extremely', 'incredibly',
  'absolutely', 'completely', 'totally', 'utterly', 'entirely', 'perfectly'
];

const fillerWords = [
  'basically', 'actually', 'literally', 'obviously', 'clearly', 'essentially',
  'fundamentally', 'generally', 'typically', 'normally', 'usually', 'simply',
  'just', 'really', 'pretty', 'kind of', 'sort of', 'like'
];

const hedgeWords = [
  'might', 'could', 'perhaps', 'maybe', 'possibly', 'probably', 'seems',
  'appears', 'tends', 'suggests', 'indicates', 'implies', 'presumably',
  'allegedly', 'supposedly', 'apparently'
];

// Words that indicate passive voice
const passiveVoiceIndicators = [
  'am', 'are', 'is', 'was', 'were', 'be', 'been', 'being',
];

// Enhanced highlight types
export type HighlightType = 
  | 'veryHardSentence'   // 30+ words - Red
  | 'hardSentence'       // 20-29 words - Yellow/Orange  
  | 'weakener'           // Adverbs, fillers, hedges - Blue
  | 'complex'            // Complex words - Purple
  | 'passive'            // Passive voice - Green
  | 'adverb';            // Legacy support

export interface EnhancedHighlight {
  type: HighlightType;
  start: number;
  end: number;
  text: string;
  severity: 'low' | 'medium' | 'high';
  suggestion?: string;
  explanation?: string;
}

export interface EnhancedReadabilityResult {
  grade: number;
  stats: {
    sentences: number;
    words: number;
    syllables: number;
    charactersPerWord: number;
    wordsPerSentence: number;
  };
  highlights: EnhancedHighlight[];
  counts: {
    veryHardSentences: number;
    hardSentences: number;
    weakeners: number;
    complexWords: number;
    passiveVoice: number;
  };
}

// Legacy interface for compatibility
export interface ReadabilityResult {
  grade: number;
  stats: {
    sentences: number;
    words: number;
    syllables: number;
    charactersPerWord: number;
    wordsPerSentence: number;
  };
  highlights: Array<{
    type: 'passive' | 'complex' | 'adverb' | 'hardSentence';
    index: number;
    length: number;
    text: string;
    note?: string;
  }>;
}

// Count syllables in a word (improved algorithm from hemingway clone)
function countSyllables(word: string): number {
  word = word.toLowerCase();
  // Remove non-alphabetic characters
  word = word.replace(/[^a-z]/g, '');
  if (!word) return 0;
  
  // Count contiguous vowel groups as syllables
  const groups = word.match(/[aeiouy]+/g);
  return groups ? groups.length : 1;
}

// Enhanced analysis functions
export function findEnhancedSentenceDifficulty(text: string): EnhancedHighlight[] {
  const highlights: EnhancedHighlight[] = [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  let currentIndex = 0;

  for (const sentence of sentences) {
    const startIndex = text.indexOf(sentence, currentIndex);
    const words = sentence.match(/\b\w+\b/g) || [];
    const wordCount = words.length;

    if (wordCount >= 30) {
      highlights.push({
        type: 'veryHardSentence',
        start: startIndex,
        end: startIndex + sentence.length,
        text: sentence.trim(),
        severity: 'high',
        explanation: `This sentence has ${wordCount} words. Try breaking it into shorter sentences.`,
        suggestion: 'Consider splitting this sentence for better readability.'
      });
    } else if (wordCount >= 20) {
      highlights.push({
        type: 'hardSentence',
        start: startIndex,
        end: startIndex + sentence.length,
        text: sentence.trim(),
        severity: 'medium',
        explanation: `This sentence has ${wordCount} words. Consider shortening it.`,
        suggestion: 'This sentence could be clearer if it were shorter.'
      });
    }

    currentIndex = startIndex + sentence.length;
  }

  return highlights;
}

export function findWeakeners(text: string): EnhancedHighlight[] {
  const highlights: EnhancedHighlight[] = [];
  const allWeakeners = [...weakeningAdverbs, ...fillerWords, ...hedgeWords];
  
  // Create a regex that matches any of the weakening words/phrases
  const weakenerPattern = new RegExp(`\\b(${allWeakeners.join('|')})\\b`, 'gi');
  let match;

  while ((match = weakenerPattern.exec(text)) !== null) {
    const word = match[0].toLowerCase();
    let suggestion = '';
    let explanation = '';

    if (weakeningAdverbs.includes(word)) {
      suggestion = 'Remove this qualifying adverb for stronger writing.';
      explanation = 'Qualifying adverbs often weaken your message.';
    } else if (fillerWords.includes(word)) {
      suggestion = 'Remove this filler word.';
      explanation = 'This word adds no meaning to your sentence.';
    } else if (hedgeWords.includes(word)) {
      suggestion = 'Be more definitive if possible.';
      explanation = 'Hedge words can make writing sound uncertain.';
    }

    highlights.push({
      type: 'weakener',
      start: match.index,
      end: match.index + match[0].length,
      text: match[0],
      severity: 'medium',
      suggestion,
      explanation
    });
  }

  return highlights;
}

export function findEnhancedComplexWords(text: string): EnhancedHighlight[] {
  const highlights: EnhancedHighlight[] = [];
  const wordPattern = /\b[a-zA-Z]{4,}\b/g;
  let match;

  while ((match = wordPattern.exec(text)) !== null) {
    const word = match[0];
    const syllables = countSyllables(word);
    
    // Skip proper nouns (basic check)
    if (word[0] === word[0].toUpperCase() && match.index > 0 && text[match.index - 1] !== '.') {
      continue;
    }

    if (syllables >= 3) {
      highlights.push({
        type: 'complex',
        start: match.index,
        end: match.index + word.length,
        text: word,
        severity: syllables >= 4 ? 'high' : 'medium',
        explanation: `This word has ${syllables} syllables.`,
        suggestion: 'Consider using a simpler alternative.'
      });
    }
  }

  return highlights;
}

export function findEnhancedPassiveVoice(text: string): EnhancedHighlight[] {
  const highlights: EnhancedHighlight[] = [];
  
  // Enhanced passive voice detection with comprehensive irregular participles
  const auxiliaries = ['is', 'are', 'was', 'were', 'be', 'been', 'being', 'am'];
  const irregularParticiples = [
    'known', 'done', 'seen', 'gone', 'made', 'taken',
    'given', 'shown', 'built', 'written', 'read', 'said',
    'heard', 'found', 'felt', 'left', 'kept', 'lost',
    'sold', 'told', 'held', 'sent', 'spent', 'lent',
    'meant', 'dealt', 'slept', 'swept', 'wept', 'crept',
    'leapt', 'learnt', 'burnt', 'spelt', 'spoilt',
    'driven', 'chosen', 'spoken', 'broken', 'stolen',
    'frozen', 'eaten', 'beaten', 'forgotten', 'gotten',
    'hidden', 'ridden', 'forbidden', 'bitten', 'torn',
    'worn', 'born', 'sworn', 'drawn', 'grown', 'thrown',
    'blown', 'flown', 'shown', 'known'
  ];

  // Create patterns for regular and irregular passives
  const patterns = [
    // Regular past participles (ending in -ed)
    new RegExp(`\\b(${auxiliaries.join('|')})\\s+\\w*ed\\b`, 'gi'),
    // Irregular participles
    new RegExp(`\\b(${auxiliaries.join('|')})\\s+(${irregularParticiples.join('|')})\\b`, 'gi')
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      highlights.push({
        type: 'passive',
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
        severity: 'medium',
        explanation: 'This appears to be passive voice.',
        suggestion: 'Consider rewriting in active voice for clarity.'
      });
    }
  }

  return highlights;
}

export function analyzeEnhancedReadability(text: string): EnhancedReadabilityResult {
  if (!text.trim()) {
    return {
      grade: 0,
      stats: { sentences: 0, words: 0, syllables: 0, charactersPerWord: 0, wordsPerSentence: 0 },
      highlights: [],
      counts: { veryHardSentences: 0, hardSentences: 0, weakeners: 0, complexWords: 0, passiveVoice: 0 }
    };
  }

  // Basic stats calculation
  const sentences = text.match(sentenceRegex) || [];
  const words = text.match(wordRegex) || [];
  const syllableCount = words.reduce((sum: number, word: string) => sum + countSyllables(word), 0);
  
  // Calculate Flesch-Kincaid Grade Level (improved from hemingway clone)
  const wordsPerSentence = words.length / Math.max(sentences.length, 1);
  const syllablesPerWord = syllableCount / Math.max(words.length, 1);
  let gradeLevel = 0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59;
  
  // Clamp grade to a reasonable range (like the Python version)
  if (gradeLevel < 0) {
    gradeLevel = 0.0;
  }
  
  // Get enhanced highlights
  const sentenceHighlights = findEnhancedSentenceDifficulty(text);
  const weakenerHighlights = findWeakeners(text);
  const complexWordHighlights = findEnhancedComplexWords(text);
  const passiveHighlights = findEnhancedPassiveVoice(text);

  const allHighlights = [
    ...sentenceHighlights,
    ...weakenerHighlights,
    ...complexWordHighlights,
    ...passiveHighlights
  ];

  // Sort by position
  allHighlights.sort((a, b) => a.start - b.start);

  const counts = {
    veryHardSentences: sentenceHighlights.filter(h => h.type === 'veryHardSentence').length,
    hardSentences: sentenceHighlights.filter(h => h.type === 'hardSentence').length,
    weakeners: weakenerHighlights.length,
    complexWords: complexWordHighlights.length,
    passiveVoice: passiveHighlights.length
  };

  return {
    grade: Math.max(0, Math.min(Math.round(gradeLevel), 12)),
    stats: {
      sentences: sentences.length,
      words: words.length,
      syllables: syllableCount,
      charactersPerWord: text.length / Math.max(words.length, 1),
      wordsPerSentence,
    },
    highlights: allHighlights,
    counts
  };
}

// Legacy function for backward compatibility
export function analyzeReadability(text: string): ReadabilityResult {
  const enhanced = analyzeEnhancedReadability(text);
  
  // Convert enhanced highlights to legacy format
  const legacyHighlights = enhanced.highlights.map(h => ({
    type: h.type === 'veryHardSentence' || h.type === 'hardSentence' ? 'hardSentence' as const :
          h.type === 'weakener' ? 'adverb' as const :
          h.type,
    index: h.start,
    length: h.end - h.start,
    text: h.text,
    note: h.explanation
  }));

  return {
    grade: enhanced.grade,
    stats: enhanced.stats,
    highlights: legacyHighlights
  };
}
