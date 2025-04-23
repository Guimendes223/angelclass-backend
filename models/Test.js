const mongoose = require('mongoose');

// Definindo o Schema do Teste
const TestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  }
});

// Criando o Model
module.exports = mongoose.model('Test', TestSchema);
