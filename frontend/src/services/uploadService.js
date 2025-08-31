import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

class UploadService {
  async uploadSingle(file) {
    const formData = new FormData();
    formData.append('image', file);

    const response = await axios.post(`${API_URL}/upload/single`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  async uploadMultiple(files) {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });

    const response = await axios.post(`${API_URL}/upload/multiple`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  async deleteFile(fileId) {
    const response = await axios.delete(`${API_URL}/upload/${fileId}`);
    return response.data;
  }
}

export const uploadService = new UploadService();