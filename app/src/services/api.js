// Всі URL Firebase Cloud Functions

const BASE_URL = "https://us-central1-numerology-bot-109da.cloudfunctions.net";

export const API = {
  registerUser: `${BASE_URL}/registerUser`,
  getUser: `${BASE_URL}/getUser`,
  generateHoroscope: `${BASE_URL}/generateHoroscope`,
  generateReport: `${BASE_URL}/generateReport`,
  createPayment: `${BASE_URL}/createPayment`,
  generateCalculation: `${BASE_URL}/generateCalculation`,
  startSession: `${BASE_URL}/startSession`,
  getSession: `${BASE_URL}/getSession`,
  getSessionResults: `${BASE_URL}/getSessionResults`,
  getProductStatus: `${BASE_URL}/getProductStatus`,
  getCalculations: `${BASE_URL}/getCalculations`,
  addPerson: `${BASE_URL}/addPerson`,
  getPeople: `${BASE_URL}/getPeople`,
  updatePerson: `${BASE_URL}/updatePerson`,
  getHomeCards: `${BASE_URL}/getHomeCards`,
  deleteAccount: `${BASE_URL}/deleteAccount`,
};
