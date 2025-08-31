import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

class InspectionService {
  async createInspection(data) {
    const response = await axios.post(`${API_URL}/inspection/create`, data);
    return response.data;
  }

  async getInspections(params = {}) {
    const response = await axios.get(`${API_URL}/inspection`, { params });
    return response.data;
  }

  async getInspectionById(id) {
    const response = await axios.get(`${API_URL}/inspection/${id}`);
    return response.data;
  }

  async deleteInspection(id) {
    const response = await axios.delete(`${API_URL}/inspection/${id}`);
    return response.data;
  }

  async getStats(days = 30) {
    const response = await axios.get(`${API_URL}/inspection/stats/summary`, {
      params: { days }
    });
    return response.data.stats;
  }
}

export const inspectionService = new InspectionService();