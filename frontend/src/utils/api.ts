const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  usedMock: boolean;
}

async function apiCall<T>(
  endpoint: string,
  options?: RequestInit,
  mockData?: T
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return { data, error: null, usedMock: false };
  } catch (error) {
    console.warn(`API call failed for ${endpoint}, using mock data:`, error);

    if (mockData !== undefined) {
      return { data: mockData, error: null, usedMock: true };
    }

    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      usedMock: false,
    };
  }
}

export const api = {
  detectPothole: async (imageData: string) => {
    return apiCall(
      '/detect/pothole',
      {
        method: 'POST',
        body: JSON.stringify({ image: imageData }),
      },
      {
        detections: [
          { type: 'pothole', confidence: 0.92, bbox: [100, 150, 200, 250] },
        ],
        timestamp: new Date().toISOString(),
      }
    );
  },

  detectDrowsiness: async (imageData: string) => {
    return apiCall(
      '/detect/drowsiness',
      {
        method: 'POST',
        body: JSON.stringify({ image: imageData }),
      },
      {
        isDrowsy: false,
        eyesClosed: false,
        confidence: 0.88,
        timestamp: new Date().toISOString(),
      }
    );
  },

  sendChatMessage: async (message: string, language: string = 'en') => {
    return apiCall(
      '/chat',
      {
        method: 'POST',
        body: JSON.stringify({ message, language }),
      },
      {
        response:
          "I'm here to help with road safety questions. This is a mock response since the backend is offline.",
        timestamp: new Date().toISOString(),
      }
    );
  },

  getRiskScore: async () => {
    return apiCall('/risk-score', {}, {
      score: 25,
      roadRisk: 20,
      driverState: 15,
      speedCompliance: 25,
      timestamp: new Date().toISOString(),
    });
  },

  getBlackspots: async () => {
    return apiCall('/blackspots', {}, {
      blackspots: [
        {
          id: '1',
          name: 'NH-44 Delhi-Agra',
          state: 'Delhi',
          accidents: 342,
          severity: 'HIGH',
          lat: 28.5,
          lng: 77.5,
        },
      ],
    });
  },

  getTripHistory: async () => {
    return apiCall('/trips', {}, {
      trips: [
        {
          id: '1',
          date: '2024-03-28',
          distance: '45 km',
          riskScore: 25,
          alerts: 3,
          duration: '1h 20m',
        },
      ],
    });
  },
};

export default api;
