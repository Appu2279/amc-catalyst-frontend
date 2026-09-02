/**
 * Where money is sent, and who it says it is going to.
 *
 * PLACEHOLDER VALUES — the fallbacks below exist so the payment flow can be
 * exercised end to end before the real account is set up. Nothing reaches
 * anyone until VITE_UPI_ID and VITE_UPI_PAYEE are set in the environment.
 *
 * Kept in env rather than hardcoded because it differs per environment, and
 * because changing where customer money lands should not need a code change and
 * a deploy.
 */
export const UPI_ID = import.meta.env.VITE_UPI_ID ?? 'amccatalyst@testupi';
export const UPI_PAYEE = import.meta.env.VITE_UPI_PAYEE ?? 'AMC Catalyst (TEST)';

/** True once real details are configured. The UI says so plainly while false. */
export const UPI_CONFIGURED = Boolean(
  import.meta.env.VITE_UPI_ID && import.meta.env.VITE_UPI_PAYEE
);

/**
 * A UPI intent link. Scanning it fills in the payee, the exact amount and the
 * reference code inside the payer's own banking app.
 *
 * Prefilling matters more than convenience. The two things that make a manual
 * payment impossible to reconcile are a wrong amount and a missing reference,
 * and both get typed by hand if the QR carries only an address.
 */
export const upiPaymentUri = ({ amount, reference }) => {
  const params = new URLSearchParams({
    pa: UPI_ID,
    pn: UPI_PAYEE,
    am: Number(amount).toFixed(2),
    cu: 'INR',
    tn: reference, // lands in the payment remarks, and in your bank statement
  });
  return `upi://pay?${params.toString()}`;
};
