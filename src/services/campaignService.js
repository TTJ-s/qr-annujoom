import axios from 'axios'

/**
 * Axios instance
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3005/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

/**
 * Generic API handler
 */
const handleRequest = async (requestFn) => {
  try {
    const response = await requestFn()

    if (response?.data?.status === 200) {
      return response.data.data ?? null
    }

    throw new Error(response?.data?.message || 'Unexpected API response')
  } catch (error) {
    if (error.response) {
      // Backend responded with error
      throw new Error(error.response.data?.message || 'Server error')
    }

    if (error.request) {
      // No response from server
      throw new Error('Unable to reach server')
    }

    // Something else
    throw new Error(error.message || 'Unknown error')
  }
}

/**
 * Fetch all campaigns
 */
export const fetchCampaigns = async () =>
  handleRequest(() => api.get('/campaign/list-campaigns'))

/**
 * Fetch single campaign
 */
export const fetchCampaignById = async (id) =>
  handleRequest(() => api.get(`/campaign/single-campaign/${id}`))

/**
 * Fetch campaigns by category
 */
export const fetchCampaignsByCategory = async (category) => {
  const campaigns = (await fetchCampaigns()) || []

  return campaigns.filter(
    (c) =>
      c &&
      c.category === category &&
      c.approval_status === 'approved' &&
      c.status === 'active'
  )
}

/**
 * General Campaigns
 */
export const fetchGeneralCampaigns = async () =>
  fetchCampaignsByCategory('General Campaign')

/**
 * Create outside app donation (Razorpay order)
 */
export const createOutsideDonation = async (donationData) =>
  handleRequest(() =>
    api.post("/donation/outside-app-donation", donationData)
  );

/**
 * Verify Razorpay payment
 */
export const verifyPayment = async (verifyData) =>
  handleRequest(() =>
    api.post("/donation/verify-payment", verifyData)
  );

