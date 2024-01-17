const mongoose = require('mongoose')

const dbConnection=()=>{
    try {
        const connect = mongoose.connect(`${process.env.MONGODB}`,{
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:',err);
    }
}

module.exports = dbConnection
