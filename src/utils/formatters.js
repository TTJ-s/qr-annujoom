// Format currency
export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '₹0'
  return '₹' + amount.toLocaleString('en-IN')
}

// Format date
export const formatDate = (dateString) => {
  if (!dateString) return 'No deadline'
  
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return 'Invalid date'
  
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).toUpperCase()
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