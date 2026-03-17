/**
 * Sentiment Analysis Module for Feedback Comments
 * Analyzes text feedback to determine sentiment polarity and categorize issues
 */

export interface SentimentResult {
  score: number; // -1 (very negative) to 1 (very positive)
  sentiment: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative';
  confidence: number; // 0 to 1
  categories: string[]; // detected issue categories
  keywords: string[]; // important keywords found
}

// Sentiment lexicon - words and their sentiment scores
const sentimentLexicon = {
  // Very Positive (0.8 - 1.0)
  excellent: 1.0, amazing: 1.0, outstanding: 1.0, delicious: 0.9,
  fantastic: 0.9, wonderful: 0.9, perfect: 0.9, great: 0.8,
  awesome: 0.9, love: 0.8, loved: 0.8, best: 0.9, tasty: 0.8,
  fresh: 0.7, yummy: 0.8, superb: 0.9, magnificent: 1.0,
  
  // Positive (0.4 - 0.7)
  good: 0.6, nice: 0.5, decent: 0.4, fine: 0.4, okay: 0.3,
  satisfactory: 0.5, acceptable: 0.4, pleasant: 0.6, enjoy: 0.6,
  enjoyed: 0.6, liked: 0.5, like: 0.5, flavorful: 0.6,
  
  // Negative (-0.4 to -0.7)
  bad: -0.6, poor: -0.6, disappointing: -0.7, mediocre: -0.4,
  subpar: -0.5, lacking: -0.4, cold: -0.5, bland: -0.6,
  tasteless: -0.7, overcooked: -0.6, undercooked: -0.6, stale: -0.7,
  
  // Very Negative (-0.8 to -1.0)
  terrible: -0.9, horrible: -0.9, awful: -0.9, disgusting: -1.0,
  worst: -1.0, hate: -0.9, hated: -0.9, inedible: -1.0,
  rotten: -1.0, spoiled: -1.0, nasty: -0.9, gross: -0.9
};

// Issue category keywords
const categoryKeywords = {
  taste: ['taste', 'flavor', 'tasty', 'bland', 'spicy', 'sweet', 'salty', 'sour', 'bitter', 'delicious', 'yummy', 'tasteless'],
  quantity: ['quantity', 'portion', 'amount', 'size', 'less', 'more', 'small', 'large', 'insufficient', 'enough', 'serving'],
  temperature: ['cold', 'hot', 'warm', 'temperature', 'lukewarm', 'freezing', 'boiling', 'cool', 'heated'],
  hygiene: ['clean', 'dirty', 'hygiene', 'sanitary', 'hygienic', 'unhygienic', 'contaminated', 'fresh', 'stale'],
  variety: ['variety', 'repetitive', 'same', 'different', 'diverse', 'monotonous', 'boring', 'options', 'choice'],
  quality: ['quality', 'fresh', 'stale', 'rotten', 'spoiled', 'overcooked', 'undercooked', 'raw', 'burnt', 'soggy'],
  service: ['service', 'staff', 'waiting', 'queue', 'time', 'delay', 'fast', 'slow', 'quick', 'efficient']
};

// Intensifiers and negations
const intensifiers = {
  very: 1.5, extremely: 1.8, really: 1.3, so: 1.2, too: 1.2,
  quite: 1.1, pretty: 1.1, absolutely: 1.6, totally: 1.5
};

const negations = ['not', 'no', 'never', 'neither', 'nor', 'none', "n't", 'hardly', 'barely'];

/**
 * Main sentiment analysis function
 */
export function analyzeSentiment(text: string, rating?: number): SentimentResult {
  if (!text || text.trim().length === 0) {
    // If no comment, use rating to determine sentiment
    if (rating) {
      return getRatingBasedSentiment(rating);
    }
    return {
      score: 0,
      sentiment: 'neutral',
      confidence: 0,
      categories: [],
      keywords: []
    };
  }

  const normalizedText = text.toLowerCase().trim();
  const words = normalizedText.split(/\s+/);
  
  let totalScore = 0;
  let scoredWords = 0;
  const foundKeywords: string[] = [];
  const detectedCategories = new Set<string>();

  // Analyze each word with context
  for (let i = 0; i < words.length; i++) {
    const word = words[i].replace(/[^\w]/g, ''); // Remove punctuation
    
    // Check for sentiment
    if (sentimentLexicon[word as keyof typeof sentimentLexicon] !== undefined) {
      let score = sentimentLexicon[word as keyof typeof sentimentLexicon];
      
      // Check for intensifiers before the word
      if (i > 0) {
        const prevWord = words[i - 1].replace(/[^\w]/g, '');
        if (intensifiers[prevWord as keyof typeof intensifiers]) {
          score *= intensifiers[prevWord as keyof typeof intensifiers];
        }
      }
      
      // Check for negations before the word (within 3 words)
      let isNegated = false;
      for (let j = Math.max(0, i - 3); j < i; j++) {
        const checkWord = words[j].replace(/[^\w]/g, '');
        if (negations.includes(checkWord)) {
          isNegated = true;
          break;
        }
      }
      
      if (isNegated) {
        score *= -0.8; // Reverse and reduce intensity
      }
      
      totalScore += score;
      scoredWords++;
      foundKeywords.push(word);
    }
    
    // Check for category keywords
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.includes(word)) {
        detectedCategories.add(category);
      }
    }
  }

  // Calculate average score
  let finalScore = scoredWords > 0 ? totalScore / scoredWords : 0;
  
  // If rating is provided, blend it with text sentiment (60% text, 40% rating)
  if (rating) {
    const ratingScore = (rating - 3) / 2; // Convert 1-5 rating to -1 to 1
    finalScore = (finalScore * 0.6) + (ratingScore * 0.4);
  }
  
  // Clamp score between -1 and 1
  finalScore = Math.max(-1, Math.min(1, finalScore));
  
  // Determine sentiment category
  let sentiment: SentimentResult['sentiment'];
  if (finalScore >= 0.5) sentiment = 'very_positive';
  else if (finalScore >= 0.15) sentiment = 'positive';
  else if (finalScore >= -0.15) sentiment = 'neutral';
  else if (finalScore >= -0.5) sentiment = 'negative';
  else sentiment = 'very_negative';
  
  // Calculate confidence based on number of sentiment words found
  const confidence = Math.min(1, scoredWords / 5);

  return {
    score: Math.round(finalScore * 100) / 100,
    sentiment,
    confidence: Math.round(confidence * 100) / 100,
    categories: Array.from(detectedCategories),
    keywords: [...new Set(foundKeywords)].slice(0, 5) // Top 5 unique keywords
  };
}

/**
 * Get sentiment based only on rating (fallback when no comment)
 */
function getRatingBasedSentiment(rating: number): SentimentResult {
  const score = (rating - 3) / 2; // Convert 1-5 to -1 to 1
  
  let sentiment: SentimentResult['sentiment'];
  if (rating === 5) sentiment = 'very_positive';
  else if (rating === 4) sentiment = 'positive';
  else if (rating === 3) sentiment = 'neutral';
  else if (rating === 2) sentiment = 'negative';
  else sentiment = 'very_negative';

  return {
    score: Math.round(score * 100) / 100,
    sentiment,
    confidence: 0.8, // High confidence for rating-based sentiment
    categories: [],
    keywords: []
  };
}

/**
 * Aggregate sentiment from multiple feedback items
 */
export function aggregateSentiment(feedbacks: Array<{ sentiment: SentimentResult }>): {
  averageScore: number;
  distribution: Record<SentimentResult['sentiment'], number>;
  totalCount: number;
  categoryFrequency: Record<string, number>;
} {
  const distribution: Record<SentimentResult['sentiment'], number> = {
    very_positive: 0,
    positive: 0,
    neutral: 0,
    negative: 0,
    very_negative: 0
  };
  
  const categoryFrequency: Record<string, number> = {};
  let totalScore = 0;

  feedbacks.forEach(feedback => {
    distribution[feedback.sentiment.sentiment]++;
    totalScore += feedback.sentiment.score;
    
    feedback.sentiment.categories.forEach(cat => {
      categoryFrequency[cat] = (categoryFrequency[cat] || 0) + 1;
    });
  });

  return {
    averageScore: feedbacks.length > 0 ? totalScore / feedbacks.length : 0,
    distribution,
    totalCount: feedbacks.length,
    categoryFrequency
  };
}

/**
 * Get sentiment color for UI display
 */
export function getSentimentColor(sentiment: SentimentResult['sentiment']): string {
  const colors = {
    very_positive: 'text-green-600',
    positive: 'text-green-500',
    neutral: 'text-gray-500',
    negative: 'text-orange-500',
    very_negative: 'text-red-600'
  };
  return colors[sentiment];
}

/**
 * Get sentiment background color for UI display
 */
export function getSentimentBgColor(sentiment: SentimentResult['sentiment']): string {
  const colors = {
    very_positive: 'bg-green-100',
    positive: 'bg-green-50',
    neutral: 'bg-gray-100',
    negative: 'bg-orange-50',
    very_negative: 'bg-red-100'
  };
  return colors[sentiment];
}

/**
 * Get sentiment emoji
 */
export function getSentimentEmoji(sentiment: SentimentResult['sentiment']): string {
  const emojis = {
    very_positive: '😄',
    positive: '🙂',
    neutral: '😐',
    negative: '🙁',
    very_negative: '😞'
  };
  return emojis[sentiment];
}

/**
 * Get sentiment label for display
 */
export function getSentimentLabel(sentiment: SentimentResult['sentiment']): string {
  const labels = {
    very_positive: 'Very Positive',
    positive: 'Positive',
    neutral: 'Neutral',
    negative: 'Negative',
    very_negative: 'Very Negative'
  };
  return labels[sentiment];
}
