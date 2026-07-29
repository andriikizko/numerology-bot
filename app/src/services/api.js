// Всі URL Firebase Cloud Functions

const BASE_URL = "https://us-central1-numerology-bot-109da.cloudfunctions.net";

export const API = {
  registerUser: `${BASE_URL}/registerUser`,
  getUser: `${BASE_URL}/getUser`,
  generateHoroscope: `${BASE_URL}/generateHoroscope`,
  generateReport: `${BASE_URL}/generateReport`,
  createPayment: `${BASE_URL}/createPayment`,
};
