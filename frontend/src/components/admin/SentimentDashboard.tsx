import React, { useMemo, useState } from 'react';
import { MessageSquare, TrendingUp, TrendingDown, AlertTriangle, ThumbsUp, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Feedback } from '../../types';
import { 
  getSentimentColor, 
  getSentimentBgColor, 
  getSentimentEmoji, 
  getSentimentLabel 
} from '../../services/sentimentAnalysis';
import { API_URL, getAuthHeaders } from '../../services/api';

interface SentimentDashboardProps {
  feedbacks: Feedback[];
  aiSummary?: string;
  aiSummaryLoading?: boolean;
  aiSummaryError?: string;
  onGenerateAiSummary?: () => void;
  showAiGenerateButton?: boolean;
}

const SentimentDashboard: React.FC<SentimentDashboardProps> = ({
  feedbacks,
  aiSummary: aiSummaryProp,
  aiSummaryLoading: aiSummaryLoadingProp,
  aiSummaryError: aiSummaryErrorProp,
  onGenerateAiSummary,
  showAiGenerateButton = true
}) => {
  const [aiSummary, setAiSummary] = useState<string>('');
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiSummaryError, setAiSummaryError] = useState<string>('');

  const sentimentStats = useMemo(() => {
    const feedbacksWithSentiment = feedbacks.filter(f => f.sentiment);
    
    if (feedbacksWithSentiment.length === 0) {
      return {
        totalCount: 0,
        averageScore: 0,
        distribution: {
          very_positive: 0,
          positive: 0,
          neutral: 0,
          negative: 0,
          very_negative: 0
        },
        categoryFrequency: {} as Record<string, number>,
        topKeywords: [] as { word: string; count: number }[],
        recentNegative: [] as Feedback[],
        topComplaints: [] as { label: string; count: number }[],
        topPraises: [] as { label: string; count: number }[],
        overallSummary: 'No sentiment data available yet.'
      };
    }

    // Calculate distribution
    const distribution = {
      very_positive: 0,
      positive: 0,
      neutral: 0,
      negative: 0,
      very_negative: 0
    };

    const categoryMap: Record<string, number> = {};
    const keywordMap: Record<string, number> = {};
    const negativeCategoryMap: Record<string, number> = {};
    const positiveKeywordMap: Record<string, number> = {};
    let totalScore = 0;

    feedbacksWithSentiment.forEach(feedback => {
      if (feedback.sentiment) {
        distribution[feedback.sentiment.sentiment]++;
        totalScore += feedback.sentiment.score;

        // Aggregate categories
        feedback.sentiment.categories.forEach(cat => {
          categoryMap[cat] = (categoryMap[cat] || 0) + 1;
        });

        // Aggregate keywords
        feedback.sentiment.keywords.forEach(kw => {
          keywordMap[kw] = (keywordMap[kw] || 0) + 1;
        });

        // Complaints (negative / very negative)
        if (feedback.sentiment.sentiment === 'negative' || feedback.sentiment.sentiment === 'very_negative') {
          feedback.sentiment.categories.forEach(cat => {
            negativeCategoryMap[cat] = (negativeCategoryMap[cat] || 0) + 1;
          });
        }

        // Praises (positive / very positive)
        if (feedback.sentiment.sentiment === 'positive' || feedback.sentiment.sentiment === 'very_positive') {
          feedback.sentiment.keywords.forEach(kw => {
            positiveKeywordMap[kw] = (positiveKeywordMap[kw] || 0) + 1;
          });
        }
      }
    });

    const averageScore = totalScore / feedbacksWithSentiment.length;

    // Get top keywords
    const topKeywords = Object.entries(keywordMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));

    const topComplaints = Object.entries(negativeCategoryMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([label, count]) => ({ label, count }));

    const topPraises = Object.entries(positiveKeywordMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([label, count]) => ({ label, count }));

    // Get recent negative feedbacks
    const recentNegative = feedbacksWithSentiment
      .filter(f => f.sentiment && (f.sentiment.sentiment === 'negative' || f.sentiment.sentiment === 'very_negative'))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    const overallSummary = (() => {
      if (averageScore >= 0.4) return 'Overall sentiment is strongly positive.';
      if (averageScore >= 0.15) return 'Overall sentiment is mostly positive with minor concerns.';
      if (averageScore >= -0.15) return 'Overall sentiment is mixed and neutral.';
      if (averageScore >= -0.4) return 'Overall sentiment is leaning negative with noticeable issues.';
      return 'Overall sentiment is strongly negative and needs attention.';
    })();

    return {
      totalCount: feedbacksWithSentiment.length,
      averageScore,
      distribution,
      categoryFrequency: categoryMap,
      topKeywords,
      recentNegative,
      topComplaints,
      topPraises,
      overallSummary
    };
  }, [feedbacks]);

  const handleGenerateAiSummary = async () => {
    setAiSummaryError('');
    setAiSummary('');

    const payloadFeedbacks = [...feedbacks]
      .filter(f => f.comment || typeof f.rating === 'number')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 30)
      .map(f => ({
        rating: f.rating,
        comment: f.comment || '',
        date: f.date
      }));

    if (payloadFeedbacks.length === 0) {
      setAiSummaryError('Not enough feedback data to summarize.');
      return;
    }

    try {
      setAiSummaryLoading(true);
      const response = await fetch(`${API_URL}/api/ai/feedback-summary`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ feedbacks: payloadFeedbacks })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to generate summary');
      }

      const data = await response.json();
      setAiSummary(data.summary || '');
    } catch (error) {
      setAiSummaryError(error instanceof Error ? error.message : 'Failed to generate summary');
    } finally {
      setAiSummaryLoading(false);
    }
  };

  const getPercentage = (count: number) => {
    if (sentimentStats.totalCount === 0) return 0;
    return Math.round((count / sentimentStats.totalCount) * 100);
  };

  const percentWidthClasses = [
    'w-[0%]', 'w-[5%]', 'w-[10%]', 'w-[15%]', 'w-[20%]',
    'w-[25%]', 'w-[30%]', 'w-[35%]', 'w-[40%]', 'w-[45%]',
    'w-[50%]', 'w-[55%]', 'w-[60%]', 'w-[65%]', 'w-[70%]',
    'w-[75%]', 'w-[80%]', 'w-[85%]', 'w-[90%]', 'w-[95%]',
    'w-[100%]'
  ];

  const getPercentWidthClass = (percentage: number) => {
    const normalized = Math.min(100, Math.max(0, Math.round(percentage / 5) * 5));
    return percentWidthClasses[normalized / 5];
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      taste: '👅',
      quantity: '🍽️',
      temperature: '🌡️',
      hygiene: '🧼',
      variety: '🎨',
      quality: '⭐',
      service: '👨‍🍳'
    };
    return icons[category] || '📋';
  };

  if (sentimentStats.totalCount === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="mr-2 text-blue-600" size={24} />
            AI Sentiment Analysis
          </CardTitle>
          <CardDescription>No feedback data available for sentiment analysis</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="mr-2 text-blue-600" size={24} />
            AI Sentiment Analysis Dashboard
          </CardTitle>
          <CardDescription>
            Powered by Natural Language Processing - Analyzing {sentimentStats.totalCount} feedbacks
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Sentiment</p>
                <p className={`text-3xl font-bold ${sentimentStats.averageScore >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {sentimentStats.averageScore.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">Scale: -1 (negative) to +1 (positive)</p>
              </div>
              {sentimentStats.averageScore >= 0 ? (
                <TrendingUp className="text-green-600" size={40} />
              ) : (
                <TrendingDown className="text-red-600" size={40} />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Positive Feedbacks</p>
                <p className="text-3xl font-bold text-green-600">
                  {getPercentage(sentimentStats.distribution.very_positive + sentimentStats.distribution.positive)}%
                </p>
                <p className="text-xs text-gray-500">
                  {sentimentStats.distribution.very_positive + sentimentStats.distribution.positive} out of {sentimentStats.totalCount}
                </p>
              </div>
              <ThumbsUp className="text-green-600" size={40} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Needs Attention</p>
                <p className="text-3xl font-bold text-red-600">
                  {getPercentage(sentimentStats.distribution.negative + sentimentStats.distribution.very_negative)}%
                </p>
                <p className="text-xs text-gray-500">
                  {sentimentStats.distribution.negative + sentimentStats.distribution.very_negative} negative feedbacks
                </p>
              </div>
              <AlertTriangle className="text-red-600" size={40} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sentiment Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2" size={20} />
            Sentiment Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(sentimentStats.distribution).map(([sentiment, count]) => {
              const percentage = getPercentage(count);
              const typedSentiment = sentiment as 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative';
              
              return (
                <div key={sentiment} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getSentimentEmoji(typedSentiment)}</span>
                      <span className={`font-medium ${getSentimentColor(typedSentiment)}`}>
                        {getSentimentLabel(typedSentiment)}
                      </span>
                    </div>
                    <span className="text-sm font-semibold">{count} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${getSentimentBgColor(typedSentiment)} border-2 ${getSentimentColor(typedSentiment).replace('text-', 'border-')} ${getPercentWidthClass(percentage)}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* AI Summary */}
      <Card>
        <CardHeader>
          <CardTitle>AI Summary</CardTitle>
          <CardDescription>Quick insights based on recent feedback</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 mb-4">{sentimentStats.overallSummary}</p>
          {showAiGenerateButton && (
            <div className="mb-4">
              <button
                type="button"
                className="px-4 py-2 text-sm rounded-md border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors disabled:opacity-60"
                onClick={onGenerateAiSummary || handleGenerateAiSummary}
                disabled={aiSummaryLoadingProp ?? aiSummaryLoading}
              >
                {(aiSummaryLoadingProp ?? aiSummaryLoading) ? 'Generating AI Summary…' : 'Generate AI Summary'}
              </button>
            </div>
          )}
          {(aiSummaryErrorProp ?? aiSummaryError) && (
            <p className="text-sm text-red-600 mb-3">{aiSummaryErrorProp ?? aiSummaryError}</p>
          )}
          {(aiSummaryProp ?? aiSummary) && (
            <div className="text-sm text-gray-700 whitespace-pre-line mb-4">
              {aiSummaryProp ?? aiSummary}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-2">Top Complaints</p>
              {sentimentStats.topComplaints.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {sentimentStats.topComplaints.map(item => (
                    <span
                      key={`complaint-${item.label}`}
                      className="px-3 py-1 rounded-full text-xs bg-red-100 text-red-700 border border-red-200"
                    >
                      {item.label} · {item.count}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500">No repeated complaints detected.</p>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-2">Top Praises</p>
              {sentimentStats.topPraises.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {sentimentStats.topPraises.map(item => (
                    <span
                      key={`praise-${item.label}`}
                      className="px-3 py-1 rounded-full text-xs bg-green-100 text-green-700 border border-green-200"
                    >
                      {item.label} · {item.count}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500">No repeated praises detected.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issue Categories */}
      {Object.keys(sentimentStats.categoryFrequency).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Issue Categories</CardTitle>
            <CardDescription>Most frequently mentioned concerns in feedback</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(sentimentStats.categoryFrequency)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 8)
                .map(([category, count]) => (
                  <div
                    key={category}
                    className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200 text-center hover:shadow-md transition-shadow"
                  >
                    <div className="text-3xl mb-2">{getCategoryIcon(category)}</div>
                    <div className="font-semibold text-gray-800 capitalize">{category}</div>
                    <div className="text-2xl font-bold text-blue-600">{count}</div>
                    <div className="text-xs text-gray-500">mentions</div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Keywords */}
      {sentimentStats.topKeywords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Trending Keywords</CardTitle>
            <CardDescription>Most common words in feedback comments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {sentimentStats.topKeywords.map(({ word, count }) => (
                <div
                  key={word}
                  className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-medium hover:bg-blue-200 transition-colors"
                >
                  {word} <span className="ml-1 text-xs bg-blue-200 px-2 py-1 rounded-full">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Negative Feedbacks */}
      {sentimentStats.recentNegative.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertTriangle className="mr-2" size={20} />
              Recent Negative Feedbacks - Needs Attention
            </CardTitle>
            <CardDescription>Latest feedback requiring immediate action</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sentimentStats.recentNegative.map(feedback => (
                <div
                  key={feedback.id}
                  className={`p-4 rounded-lg border-l-4 ${feedback.sentiment?.sentiment === 'very_negative' ? 'border-red-600 bg-red-50' : 'border-orange-500 bg-orange-50'}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{feedback.sentiment && getSentimentEmoji(feedback.sentiment.sentiment)}</span>
                      <span className={`font-semibold ${feedback.sentiment && getSentimentColor(feedback.sentiment.sentiment)}`}>
                        {feedback.sentiment && getSentimentLabel(feedback.sentiment.sentiment)}
                      </span>
                      <span className="text-sm text-gray-500">• Score: {feedback.sentiment?.score.toFixed(2)}</span>
                    </div>
                    <span className="text-xs text-gray-500">{new Date(feedback.date).toLocaleDateString()}</span>
                  </div>
                  {feedback.comment && (
                    <p className="text-sm text-gray-700 mb-2 italic">"{feedback.comment}"</p>
                  )}
                  {feedback.sentiment && feedback.sentiment.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {feedback.sentiment.categories.map(cat => (
                        <span key={cat} className="text-xs px-2 py-1 bg-white rounded-full border border-gray-300">
                          {getCategoryIcon(cat)} {cat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SentimentDashboard;
