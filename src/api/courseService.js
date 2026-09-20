import axiosInstance from "../lib/axiosInstance";

export const getCourses = () => {
  return axiosInstance.get("/courses");
};
// One plan, with its pricing, features and benefits — what checkout shows the
// buyer they are about to pay for.
export const getCourseById = (id) => axiosInstance.get(`/courses/${id}`);

// The current AUD→INR rate. Public — the signed-out Pricing page needs it to
// show an INR estimate next to each AUD price. Admin-only to update, via
// updatePricingConfig below.
export const getPricingConfig = () => axiosInstance.get('/pricing-config');
export const updatePricingConfig = (aud_to_inr_rate) =>
  axiosInstance.put('/pricing-config', { aud_to_inr_rate });
