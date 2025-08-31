import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

class ItemService {
  async getItems(category = null) {
    const params = category ? { category } : {};
    const response = await axios.get(`${API_URL}/items`, { params });
    return response.data;
  }

  async getItemById(id) {
    const response = await axios.get(`${API_URL}/items/${id}`);
    return response.data;
  }

  async createItem(data) {
    const response = await axios.post(`${API_URL}/items`, data);
    return response.data;
  }

  async updateItem(id, data) {
    const response = await axios.put(`${API_URL}/items/${id}`, data);
    return response.data;
  }

  async deleteItem(id) {
    const response = await axios.delete(`${API_URL}/items/${id}`);
    return response.data;
  }

  async initializeDefaultItems() {
    const response = await axios.post(`${API_URL}/items/initialize`);
    return response.data;
  }
}

export const itemService = new ItemService();