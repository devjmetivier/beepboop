const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const snippetSchema = new mongoose.Schema({
    type: {
        type: String,
        trim: true
    },
    name: {
        type: String,
        trim: true,
        required: 'Please enter a name for the snippet!'
    },
    snippet: {
        type: String,
        trim: true
    },
    gist: {
        type: String,
        trim: true
    }
});

module.exports = mongoose.model('Snippet', snippetSchema);