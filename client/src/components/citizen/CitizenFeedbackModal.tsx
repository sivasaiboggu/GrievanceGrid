import React, { useState } from 'react';
import { api } from '../../api';

interface CitizenFeedbackModalProps {
  complaintId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const CitizenFeedbackModal: React.FC<CitizenFeedbackModalProps> = ({
  complaintId,
  onClose,
  onSuccess,
}) => {
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      await api.submitFeedback(complaintId, { rating, comments });
      setSubmitted(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to submit feedback.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[var(--civic-border)] p-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--civic-secondary)] text-[22px]">
              rate_review
            </span>
            <h2 className="text-[17px] font-bold text-[var(--civic-primary)]">
              Citizen Feedback & Rating
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--civic-canvas)] text-[var(--civic-text-muted)] hover:text-[var(--civic-primary)] flex items-center justify-center"
          >
            &times;
          </button>
        </div>

        {error && (
          <div className="mb-3 p-2.5 bg-[#ffdad6] text-[#93000a] text-[12px] rounded-lg">
            {error}
          </div>
        )}

        {submitted ? (
          <div className="flex flex-col items-center text-center py-6 space-y-2">
            <div className="w-12 h-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px]">check_circle</span>
            </div>
            <h3 className="text-[16px] font-bold text-[var(--civic-primary)]">Feedback Recorded</h3>
            <p className="text-[13px] text-[var(--civic-text-muted)]">
              Thank you for contributing to municipal service quality auditing.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-[13px] text-[var(--civic-text-muted)] leading-relaxed">
              How would you rate the speed, communication, and physical quality of the remediation completed for this grievance?
            </p>

            {/* Star Rating */}
            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <span
                    className={`material-symbols-outlined text-[32px] ${
                      rating >= star ? 'text-amber-400' : 'text-gray-300'
                    }`}
                    style={{ fontVariationSettings: rating >= star ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    star
                  </span>
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-semibold text-[var(--civic-primary)]">
                Additional Comments (Optional)
              </label>
              <textarea
                rows={3}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Share notes on the crew's work, cleanup thoroughness, or timeliness..."
                className="w-full p-2.5 bg-[var(--civic-canvas)] border border-[var(--civic-border)] rounded-xl text-[13px] focus:bg-white focus:outline-none focus:border-[var(--civic-secondary)] resize-none"
              />
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="w-full h-11 rounded-lg bg-[var(--civic-container)] text-white text-[14px] font-semibold flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50 shadow-sm"
              >
                {submitting ? 'Submitting...' : 'Submit Citizen Feedback'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full h-9 text-[13px] text-[var(--civic-text-muted)] hover:text-[var(--civic-primary)] font-medium"
              >
                Skip & Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
