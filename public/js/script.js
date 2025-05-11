/**
 * Date functions for CSE Motors website
 */

// Get current date information
function getCurrentDate() {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1, // JavaScript months are 0-indexed
    day: now.getDate(),
    hours: now.getHours(),
    minutes: now.getMinutes(),
    seconds: now.getSeconds()
  };
}

// Format date as MM/DD/YYYY
function formatDate(date) {
  const dateObj = date || new Date();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const year = dateObj.getFullYear();
  
  return `${month}/${day}/${year}`;
}

// Format time as HH:MM:SS (12-hour format with AM/PM)
function formatTime(date) {
  const dateObj = date || new Date();
  let hours = dateObj.getHours();
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const seconds = String(dateObj.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours || 12; // Convert 0 to 12 for 12 AM
  const formattedHours = String(hours).padStart(2, '0');
  
  return `${formattedHours}:${minutes}:${seconds} ${ampm}`;
}

// Get formatted current date and time
function getCurrentDateTime() {
  const now = new Date();
  return {
    date: formatDate(now),
    time: formatTime(now)
  };
}

// Calculate days between two dates
function daysBetween(date1, date2) {
  // Convert both dates to milliseconds
  const date1Ms = date1.getTime();
  const date2Ms = date2.getTime();
  
  // Calculate the difference in milliseconds
  const differenceMs = Math.abs(date1Ms - date2Ms);
  
  // Convert back to days
  return Math.round(differenceMs / (1000 * 60 * 60 * 24));
}

// Add days to a date
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Update footer with current year
function updateFooterYear() {
  const yearElement = document.getElementById('year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}

// Initialize date functions when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Update footer year
  updateFooterYear();
  
  // Add any other initialization code here
});
