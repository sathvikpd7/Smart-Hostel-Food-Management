import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import SentimentDashboard from '../../components/admin/SentimentDashboard';
import { useFeedback } from '../../contexts/FeedbackContext';
import { API_URL, getAuthHeaders } from '../../services/api';

const AiSummaryPage: React.FC = () => {
  const { feedbacks } = useFeedback();
  const [aiSummary, setAiSummary] = useState<string>('');
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiSummaryError, setAiSummaryError] = useState<string>('');
  const [history, setHistory] = useState<Array<{ id: string; summary: string; created_at: string }>>([]);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/api/ai/feedback-summary`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) return;
      const data = await response.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleGenerate = async () => {
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
      await fetchHistory();
    } catch (error) {
      setAiSummaryError(error instanceof Error ? error.message : 'Failed to generate summary');
    } finally {
      setAiSummaryLoading(false);
    }
  };

  return (
    <AdminLayout
      title="AI Summary"
      subtitle="AI-powered insights and action items from feedback"
      actionButton={
        <button
          type="button"
          className="px-4 py-2 text-sm rounded-md border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors disabled:opacity-60"
          onClick={handleGenerate}
          disabled={aiSummaryLoading}
        >
          {aiSummaryLoading ? 'Generating…' : 'Generate Summary'}
        </button>
      }
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles size={20} className="mr-2 text-blue-600" />
              Feedback Summary
            </CardTitle>
            <CardDescription>
              Generate concise summaries, top complaints, and action items using AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Use the "Generate AI Summary" button below to get a quick overview of recent feedback.
            </p>
          </CardContent>
        </Card>

        <SentimentDashboard
          feedbacks={feedbacks}
          aiSummary={aiSummary}
          aiSummaryLoading={aiSummaryLoading}
          aiSummaryError={aiSummaryError}
          onGenerateAiSummary={handleGenerate}
          showAiGenerateButton={false}
        />

        <Card>
          <CardHeader>
            <CardTitle>Summary History</CardTitle>
            <CardDescription>Most recent AI summaries</CardDescription>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-gray-500">No summaries yet.</p>
            ) : (
              <div className="space-y-4">
                {history.map(item => (
                  <div key={item.id} className="border rounded-md p-4">
                    <div className="text-xs text-gray-500 mb-2">
                      {new Date(item.created_at).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-700 whitespace-pre-line">
                      {item.summary}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AiSummaryPage;
