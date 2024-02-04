// const mongoose = require('mongoose')

// const dbConnection=()=>{
//     try {
//         const connect = mongoose.connect(process.env.MONGODB,{
//             useNewUrlParser: true,
//             useUnifiedTopology: true
//         })
//         console.log('Connected to MongoDB');
//     } catch (error) {
//         console.error('MongoDB connection error:',err);
//     }
// }

// module.exports = dbConnection

const mongoose = require('mongoose')
require('dotenv').config()

console.log(process.env.MONGODB);
mongoose.connect(process.env.MONGODB, {
    
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
// console.log(mongoose.connection);
// console.log(process.env.DB_URL)
const dbConnection = mongoose.connection;
dbConnection.on('error', console.error.bind(console, 'MongoDB connection error:'));
dbConnection.once('open', () => {
  console.log('Connected to MongoDB');
});

module.exports = dbConnection