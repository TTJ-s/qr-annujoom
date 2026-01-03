import moment from "moment-timezone";

// Format currency
export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '₹0'
  return '₹' + amount.toLocaleString('en-IN')
}

// Calculate progress percentage
export const calculateProgress = (collectedAmount, targetAmount) => {
  if (!targetAmount || targetAmount === 0) return 0
  return Math.min(Math.round((collectedAmount / targetAmount) * 100), 100)
}

// Clean description text
export const cleanDescription = (text, maxLength = 150) => {
  if (!text) return ''
  
  let cleaned = text.replace(/["']/g, '').trim()
  if (cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength) + '...'
  }
  return cleaned
}

export const formatDate = (
  date,
  timezone = "Asia/Kolkata"
) => {
  if (!date) return "";

  return moment(date)
    .tz(timezone)
    .format("DD MMM YYYY")
    .toUpperCase(); 
};