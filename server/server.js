require('dotenv').config();
const { app, server } = require('./api');

const PORT = process.env.PORT || 8000;
 
// Start the server
server.listen(PORT, () => {
  console.log(`SnapFAI server running on port ${PORT}`);
  console.log(`API endpoint: http://localhost:${PORT}/api`);
}); 