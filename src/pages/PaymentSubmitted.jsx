import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/_DashboardLayout';

/**
 * Where the buyer lands after saying they have paid.
 *
 * Its job is to stop them worrying and stop them paying twice. Both are real
 * risks while a human is checking a bank statement: silence reads as failure,
 * and a buyer who thinks the first transfer failed will send another.
 *
 * The dashboard carries the same state on every visit afterwards, so this page
 * is the first telling rather than the only one.
 */
export const PaymentSubmitted = () => (
  <DashboardLayout active="dashboard">
    <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-24 text-center">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50">
        <CheckCircle2 className="h-7 w-7 text-green-600" />
      </div>

      <h1 className="text-2xl font-bold text-slate-900">Thanks — we have your details</h1>

      <p className="mt-3 text-sm leading-relaxed text-slate-500">
        We are checking your transfer against our bank statement. Access usually opens within
        two working days, and you will see it on your dashboard as soon as it does.
      </p>

      <div className="mt-6 flex w-full items-start gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-left">
        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
        <p className="text-sm text-slate-600">
          There is nothing else to do. Please do not send the payment again — if anything is
          unclear we will contact you on the email address on your account.
        </p>
      </div>

      <Link
        to="/dashboard"
        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-700"
      >
        Go to dashboard
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  </DashboardLayout>
);
