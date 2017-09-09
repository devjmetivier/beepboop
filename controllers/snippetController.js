const mongoose = require('mongoose');
const Snippet = mongoose.model('Snippet');
const promisify = require('es6-promisify');

exports.saveSnippet = async (state) => {
    const snippet = await (new Snippet(state)).save();
    return state;
};

exports.spit = async (text, match) => {
    const reply = {
        text,
        match
    };
    return reply;
};