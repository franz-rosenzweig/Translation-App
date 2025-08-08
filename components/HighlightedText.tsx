"use client";

import { useMemo, useState } from 'react';
import { analyzeEnhancedReadability, type EnhancedHighlight, type HighlightType } from '@/lib/hemingway';

interface HighlightedTextProps {
  text: string;
  enabledHighlights?: Set<HighlightType>;
  showTooltips?: boolean;
}

// Color scheme matching Hemingway app
const highlightColors = {
  veryHardSentence: 'bg-red-200/60 hover:bg-red-200/80', // Red for very hard sentences
  hardSentence: 'bg-yellow-200/60 hover:bg-yellow-200/80', // Yellow for hard sentences
  weakener: 'bg-blue-200/60 hover:bg-blue-200/80', // Blue for weakeners
  complex: 'bg-purple-200/60 hover:bg-purple-200/80', // Purple for complex words
  passive: 'bg-green-200/60 hover:bg-green-200/80', // Green for passive voice
  adverb: 'bg-blue-200/60 hover:bg-blue-200/80' // Blue for legacy adverbs
};

interface TextSegment {
  text: string;
  highlights: EnhancedHighlight[];
  start: number;
  end: number;
}

function segmentText(text: string, highlights: EnhancedHighlight[]): TextSegment[] {
  if (highlights.length === 0) {
    return [{ text, highlights: [], start: 0, end: text.length }];
  }

  const segments: TextSegment[] = [];
  let currentPos = 0;

  // Sort highlights by start position
  const sortedHighlights = [...highlights].sort((a, b) => a.start - b.start);

  for (const highlight of sortedHighlights) {
    // Add text before this highlight
    if (currentPos < highlight.start) {
      segments.push({
        text: text.slice(currentPos, highlight.start),
        highlights: [],
        start: currentPos,
        end: highlight.start
      });
    }

    // Add the highlighted text
    const segmentStart = Math.max(currentPos, highlight.start);
    const segmentEnd = highlight.end;
    
    // Find overlapping highlights
    const overlappingHighlights = sortedHighlights.filter(h => 
      h.start < segmentEnd && h.end > segmentStart
    );

    segments.push({
      text: text.slice(segmentStart, segmentEnd),
      highlights: overlappingHighlights,
      start: segmentStart,
      end: segmentEnd
    });

    currentPos = Math.max(currentPos, highlight.end);
  }

  // Add remaining text
  if (currentPos < text.length) {
    segments.push({
      text: text.slice(currentPos),
      highlights: [],
      start: currentPos,
      end: text.length
    });
  }

  return segments;
}

export default function HighlightedText({ 
  text, 
  enabledHighlights = new Set<HighlightType>(['veryHardSentence', 'hardSentence', 'weakener', 'complex', 'passive']), 
  showTooltips = true 
}: HighlightedTextProps) {
  const [hoveredHighlight, setHoveredHighlight] = useState<EnhancedHighlight | null>(null);

  const analysis = useMemo(() => {
    return analyzeEnhancedReadability(text);
  }, [text]);

  const filteredHighlights = useMemo(() => {
    return analysis.highlights.filter(h => enabledHighlights.has(h.type));
  }, [analysis.highlights, enabledHighlights]);

  const segments = useMemo(() => {
    return segmentText(text, filteredHighlights);
  }, [text, filteredHighlights]);

  if (!text.trim()) {
    return <div className="text-muted p-4">No text to analyze.</div>;
  }

  return (
    <div className="relative">
      <div className="whitespace-pre-wrap leading-relaxed">
        {segments.map((segment, index) => {
          if (segment.highlights.length === 0) {
            return <span key={index}>{segment.text}</span>;
          }

          // Get the primary highlight (first one, or highest priority)
          const primaryHighlight = segment.highlights[0];
          const highlightClass = highlightColors[primaryHighlight.type];

          return (
            <span
              key={index}
              className={`${highlightClass} rounded px-0.5 cursor-pointer transition-colors duration-150 relative`}
              onMouseEnter={() => showTooltips && setHoveredHighlight(primaryHighlight)}
              onMouseLeave={() => setHoveredHighlight(null)}
              title={showTooltips ? primaryHighlight.explanation : undefined}
            >
              {segment.text}
              
              {/* Tooltip */}
              {showTooltips && hoveredHighlight === primaryHighlight && (
                <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg max-w-xs">
                  <div className="font-medium mb-1">
                    {primaryHighlight.type === 'veryHardSentence' ? 'Very Hard Sentence' :
                     primaryHighlight.type === 'hardSentence' ? 'Hard Sentence' :
                     primaryHighlight.type === 'weakener' ? 'Weakening Word' :
                     primaryHighlight.type === 'complex' ? 'Complex Word' :
                     primaryHighlight.type === 'passive' ? 'Passive Voice' :
                     'Issue'}
                  </div>
                  <div className="text-xs opacity-90 mb-1">{primaryHighlight.explanation}</div>
                  {primaryHighlight.suggestion && (
                    <div className="text-xs opacity-75 italic">{primaryHighlight.suggestion}</div>
                  )}
                  
                  {/* Arrow */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}
