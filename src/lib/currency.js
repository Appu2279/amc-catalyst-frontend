// Prices are in Australian dollars, but a bare "$" reads as USD to most
// buyers — so every AUD amount carries an explicit "AUD" label.
const audNumber = new Intl.NumberFormat('en-AU', { maximumFractionDigits: 0 });

/** "$300" — only for places that render the "AUD" label separately next to it. */
export const formatAudAmount = (value) => `$${audNumber.format(value)}`;

/** "$300 AUD" */
export const formatAud = (value) => `${formatAudAmount(value)} AUD`;
