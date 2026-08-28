export const EMPTY_SUBSCRIPTION_FORM = {
  name: '',
  email: '',
  subscribedBy: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  amount: 0,
  isFreeTrial: false,
  trialExpirationDate: '',
};

export type SubscriptionFormValues = typeof EMPTY_SUBSCRIPTION_FORM;

// sessionStorage keys used to recover the add/edit modal when returning from
// external links.
export const SUB_MODAL_KEYS = {
  open: 'sub_modal_open',
  data: 'sub_modal_data',
  edit: 'sub_modal_edit',
} as const;

// Builds the human-readable status string shown for a subscription.
export function buildSubscriptionStatus(isFreeTrial: boolean, trialExpirationDate: string): string {
  return isFreeTrial
    ? `Free Trial${
        trialExpirationDate
          ? ` (Ends ${new Date(trialExpirationDate).toLocaleDateString('en-US', {
              month: 'numeric',
              day: 'numeric',
              year: 'numeric',
            })})`
          : ''
      }`
    : 'Active';
}
