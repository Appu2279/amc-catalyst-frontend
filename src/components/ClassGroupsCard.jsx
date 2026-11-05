import React, { useEffect, useState } from 'react';
import { MessageCircle, Send, Video } from 'lucide-react';
import { getMyClassGroups } from '@/api/userService';

/**
 * WhatsApp and Telegram invite links for the online classes. Only plans with
 * the 'online_classes' section (AMC Full Course) get them, and the links come
 * from the API rather than the bundle so nobody else can find them.
 */
export const ClassGroupsCard = ({ isEnabled }) => {
  const [links, setLinks] = useState(null);

  useEffect(() => {
    if (!isEnabled) return;
    getMyClassGroups()
      .then((res) => setLinks(res.data))
      // Nothing useful to show a student if this fails; the card just stays hidden.
      .catch(() => setLinks(null));
  }, [isEnabled]);

  if (!isEnabled || !(links?.whatsapp_url || links?.telegram_url)) return null;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-brand-violet">
        <Video className="h-6 w-6" />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="font-bold text-slate-900">Online class groups</h2>
        <p className="mt-1 text-sm text-slate-500">
          Join for class links, schedules and announcements for your AMC Full Course.
        </p>
      </div>
      <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
        {links.whatsapp_url && (
          <a
            href={links.whatsapp_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:brightness-95"
          >
            <MessageCircle className="h-4 w-4" /> Join WhatsApp
          </a>
        )}
        {links.telegram_url && (
          <a
            href={links.telegram_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#229ED9] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:brightness-95"
          >
            <Send className="h-4 w-4" /> Join Telegram
          </a>
        )}
      </div>
    </div>
  );
};
