const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const snippetSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: 'Please enter a name for the snippet!'
    },

});