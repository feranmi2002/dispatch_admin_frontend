import { useState } from 'react';
import { Settings, Send } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { notificationsApi } from '../../api/notifications';

export function SettingsPage() {
  const [userId, setUserId] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const notifyMutation = useMutation({
    mutationFn: () =>
      notificationsApi.sendToUser({
        user_id: Number(userId),
        title,
        body,
      }),
    onSuccess: () => {
      toast.success('Notification sent');
      setTitle('');
      setBody('');
    },
    onError: () => toast.error('Failed to send notification'),
  });

  const isValid = Boolean(userId && title.trim() && body.trim());

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
          <Settings className="w-5 h-5 text-slate-400" />
        </div>
        <div>
          <p className="text-lg font-semibold text-slate-700">Settings</p>
          <p className="text-xs text-slate-400">Admin tools and actions</p>
        </div>
      </div>

      <div className="card p-5 max-w-xl">
        <p className="section-title mb-3">Send Notification</p>
        <div className="space-y-3">
          <div>
            <label className="label">User ID</label>
            <input
              type="number"
              className="input"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="e.g. 42"
            />
          </div>
          <div>
            <label className="label">Title</label>
            <input
              type="text"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Payout processed"
            />
          </div>
          <div>
            <label className="label">Body</label>
            <textarea
              className="input h-24 resize-none"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Your March payout has been processed."
            />
          </div>
          <div className="flex justify-end">
            <button
              className="btn-primary text-sm"
              onClick={() => notifyMutation.mutate()}
              disabled={!isValid || notifyMutation.isPending}
            >
              <Send className="w-3.5 h-3.5" />
              Send Notification
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
