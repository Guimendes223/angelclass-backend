require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const companionProfileRoutes = require('./routes/companionProfileRoutes');
const clientProfileRoutes = require('./routes/clientProfileRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const searchRoutes = require('./routes/searchRoutes');
const messagingRoutes = require('./routes/messagingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const complianceRoutes = require('./routes/complianceRoutes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/companions', companionProfileRoutes);
app.use('/api/clients', clientProfileRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/messaging', messagingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/compliance', complianceRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('Angelclass API is running');
});
app.get('/test', (req, res) => {
  res.json({ message: 'Rota funcionando!' });
});
const Test = require('./models/Test');  // Importa o Model

// Rota de teste do banco de dados
app.get('/test-db', async (req, res) => {
  try {
    // Cria um novo documento e salva no banco
    const testItem = new Test({ name: 'Banco funcionando' });
    await testItem.save(); // Salva o item no banco de dados

    // Consulta todos os itens salvos no banco
    const allTests = await Test.find(); // Busca todos os documentos da coleção 'Test'

    // Envia a resposta com os dados do banco
    res.json(allTests);  // Retorna a lista de itens
  } catch (err) {
    res.status(500).json({ error: 'Erro ao conectar ao banco' });  // Se houver erro, retorna uma mensagem
  }
});


// Connect to MongoDB and start server
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/angelclass')
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });

