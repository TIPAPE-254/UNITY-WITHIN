import express from 'express';
const app = express();
const port = process.env.PORT || 3001;

// Middleware to parse JSON bodies
app.use(express.json());

// Basic route for health check
app.get('/', (req, res) => {
  res.json({ message: 'Unity Within Backend Server is running!' });
});

// Example API route for wellness data (placeholder)
app.get('/api/wellness', (req, res) => {
  res.json({
    tools: ['Grounding', 'Reframing', 'Sound Therapy'],
    message: 'Wellness tools available'
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
