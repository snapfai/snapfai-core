const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const redis = require('redis');
const { processPrompt } = require('../services/aiService');
const { confirmSwap } = require('../services/swapService');
const { executeSwap } = require('../services/executionService');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Redis client setup
let redisClient;
if (process.env.REDIS_URL) {
  redisClient = redis.createClient({
    url: process.env.REDIS_URL
  });
} else {
  redisClient = redis.createClient();
}

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

(async () => {
  await redisClient.connect();
})();

// Endpoint for processing prompts
app.post('/api/prompt', async (req, res) => {
  try {
    const { text, userId } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Prompt text is required' });
    }
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const result = await processPrompt(text, userId, redisClient);
    return res.json(result);
  } catch (error) {
    console.error('Error processing prompt:', error);
    return res.status(500).json({ error: 'An error occurred while processing your request' });
  }
});

// Endpoint for confirming swaps
app.post('/api/swap/confirm', async (req, res) => {
  try {
    const data = req.body;
    
    if (!data.userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const result = await confirmSwap(data, redisClient);
    return res.json(result);
  } catch (error) {
    console.error('Error confirming swap:', error);
    return res.status(500).json({ error: 'An error occurred while confirming the swap' });
  }
});

// Endpoint for executing swaps
app.post('/api/swap/execute', async (req, res) => {
  try {
    const { userId, confirm } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    if (confirm !== 'Yes' && confirm !== 'yes') {
      return res.json({ message: 'Swap cancelled' });
    }
    
    const pendingSwap = await redisClient.get(`pendingSwap:${userId}`);
    
    if (!pendingSwap) {
      return res.status(404).json({ error: 'No pending swap found' });
    }
    
    const swapData = JSON.parse(pendingSwap);
    const result = await executeSwap(swapData);
    
    // Clean up the pending swap after execution
    await redisClient.del(`pendingSwap:${userId}`);
    
    return res.json(result);
  } catch (error) {
    console.error('Error executing swap:', error);
    return res.status(500).json({ error: 'An error occurred while executing the swap' });
  }
});

// WebSocket connection
io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('message', async (data) => {
    try {
      const { text, userId } = data;
      
      if (!text || !userId) {
        socket.emit('error', { message: 'Invalid input. Please provide text and userId.' });
        return;
      }
      
      const result = await processPrompt(text, userId, redisClient);
      socket.emit('response', result);
    } catch (error) {
      console.error('Error processing socket message:', error);
      socket.emit('error', { message: 'An error occurred while processing your message.' });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, redisClient }; 