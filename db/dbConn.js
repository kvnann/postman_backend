const mongoose = require('mongoose');
const connectDB = ()=>{
    mongoose.connect(`${process.env.MONGOURI}`,{ useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Connected to MongoDB');
      })
      .catch((error) => {
        console.error('Error connecting to MongoDB:', error);
      });

    const db = mongoose.connection;
    
    db.on('connected', () => {
        // console.log('Connected to MongoDB');
      });
      
      db.on('error', (error) => {
        console.error('Error connecting to MongoDB:', error);
      });
      
      db.on('disconnected', () => {
        console.log('Disconnected from MongoDB');
      });
}

module.exports = connectDB;