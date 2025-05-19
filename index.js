const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins (for development)
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// --- MongoDB Setup ---
mongoose.connect('mongodb+srv://docEditorUser:charan%402004@cluster0.lxmkwdz.mongodb.net/doc-editor?retryWrites=true&w=majority&appName=Cluster0')
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB error:', err));


// --- Document Schema ---
const Document = mongoose.model('Document', new mongoose.Schema({
  _id: String,
  content: String
}));

// --- API Route to Get Document ---
app.get('/documents/:id', async (req, res) => {
  const doc = await Document.findById(req.params.id);
  if (doc) res.json(doc);
  else res.status(404).json({ message: 'Document not found' });
});

// --- WebSocket Sync ---
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-document', async (docId) => {
    socket.join(docId);
    const doc = await Document.findById(docId) || new Document({ _id: docId, content: '' });
    await doc.save();
    socket.emit('load-document', doc.content);

    socket.on('send-changes', (delta) => {
      socket.broadcast.to(docId).emit('receive-changes', delta);
    });

    socket.on('save-document', async (data) => {
      await Document.findByIdAndUpdate(docId, { content: data });
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// --- Start Server ---
const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
