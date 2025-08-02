import { sendMessage, getChatHistory } from '../services/chatService';
import api from '../services/api';

jest.mock('../services/api');

describe('Chat Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      const mockResponse = { data: { success: true } };
      api.post.mockResolvedValue(mockResponse);

      const result = await sendMessage('room123', 'Hello world!');
      
      expect(api.post).toHaveBeenCalledWith('/chat/messages', {
        roomId: 'room123',
        text: 'Hello world!'
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle send message failure', async () => {
      const mockError = new Error('Network error');
      api.post.mockRejectedValue(mockError);

      await expect(sendMessage('room123', 'Hello'))
        .rejects
        .toThrow('Network error');
    });
  });

  describe('getChatHistory', () => {
    it('should fetch chat history', async () => {
      const mockMessages = [{ id: 1, text: 'Hi' }];
      api.get.mockResolvedValue({ data: { messages: mockMessages } });

      const result = await getChatHistory('room123');
      
      expect(api.get).toHaveBeenCalledWith('/chat/rooms/room123/messages');
      expect(result).toEqual(mockMessages);
    });
  });
});
