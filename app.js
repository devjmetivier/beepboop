const express = require('express');
const Slapp = require('slapp');
const ConvoStore = require('slapp-convo-beepboop');
const Context = require('slapp-context-beepboop');
const mongoose = require('mongoose');
const Snippet = require('./models/Snippet');

// controllers
const snippetController = require('./controllers/snippetController');

// import environmental variables from our variables.env file
require('dotenv').config({ path: 'variables.env' });

// Connect to Database and handle an bad connections
mongoose.connect(process.env.DATABASE, { useMongoClient: true });
mongoose.Promise = global.Promise; // Tell Mongoose to use ES6 promises
mongoose.connection.on('error', (err) => {
    console.error(`🙅 🚫 🙅 🚫 🙅 🚫 🙅 🚫 → ${err.message}`);
});

// import all of the models
require('./models/Snippet');

// use `PORT` env var on Beep Boop - default to 3000 locally
const port = process.env.PORT || 3000;

const slapp = Slapp({
    // Beep Boop sets the SLACK_VERIFY_TOKEN env var
    verify_token: process.env.SLACK_VERIFY_TOKEN,
    convo_store: ConvoStore(),
    context: Context()
});


const HELP_TEXT = `
I will respond to the following messages:
\`help\` - to see this message.
`;

//*********************************************
// Setup different handlers for messages
//*********************************************

// response to the user typing "help"
slapp.message('help', ['mention', 'direct_message'], (msg) => {
    msg.say(HELP_TEXT);
});

// Can use a regex as well
slapp.message(/^(thanks|thank you)/i, ['mention', 'direct_message'], (msg) => {
    // You can provide a list of responses, and a random one will be chosen
    // You can also include slack emoji in your responses
    msg.say([
        "You're welcome :smile:",
        'You bet',
        ':+1: Of course',
        'Anytime :sun_with_face: :full_moon_with_face:'
    ])
});

// demonstrate returning an attachment...
slapp.message('attachment', ['mention', 'direct_message'], (msg) => {
    msg.say({
        text: 'Check out this amazing attachment! :confetti_ball: ',
        attachments: [{
            text: 'Slapp is a robust open source library that sits on top of the Slack APIs',
            title: 'Slapp Library - Open Source',
            image_url: 'https://storage.googleapis.com/beepboophq/_assets/bot-1.22f6fb.png',
            title_link: 'https://beepboophq.com/',
            color: '#7CD197'
        }]
    })
});

slapp.message(/(save|store) (snippet|code)/gi, ['direct_mention', 'direct_message'], async (msg, text) => {
    // let state = { requested: Date.now() };
    let state = {};
    msg
        .say({
            text: 'Would you like to save a snippet or a link to a gist?',
            attachments: [{
                text: '',
                fallback: 'snippet or gist',
                callback_id: 'save_snippet_callback',
                actions: [
                    { name: 'type', text: 'Snippet', type: 'button', value: 'snippet' },
                    { name: 'type', text: 'Gist', type: 'button', value: 'gist' }
                ]
            }]
        })
        .route('get_type', state, 60);
});
slapp.route('get_type', (msg, state) => {
    if (msg.type !== 'action') {
        msg
            .say('Please choose the Snippet or Gist button :wink:')
            .route('get_type', state, 60);
        return;
    }

    state.type = msg.body.actions[0].value;

    msg
        .respond(msg.body.response_url, {
            text: '',
            delete_original: true
        })
        .say(`You want to save a \`${state.type}\`. What do you want to name it?`)
        .route('get_snippet_name', state, 60);
});
slapp.route('get_snippet_name', (msg, state) => {
    let name = (msg.body.event && msg.body.event.text) || '';
    if (!name) {
        return msg
            .say('Hey! Still waiting on a response from ya!')
            .say(`You want to save a \`${state.name}\`. What do you want to name it?`)
            .route('get_snippet_name', state, 60);
    }

    state.name = name;
    msg
        .say(`Alright! What would like to save for the ${state.type}: \`${state.name}\`?`)
        .route('get_snippet_info', state, 60);
});
slapp.route('get_snippet_info', async (msg, state) => {
    let info = (msg.body.event && msg.body.event.text) || '';
    if (!info) {
        return msg
            .say('Hey! Still waiting on a response from ya!')
            .say(`You want to save a \`${state.name}\`. What do you need me to save?`)
            .route('get_snippet_info', state, 60);
    }

    state.snippet = state.type === 'snippet' ? (msg.body.event && msg.body.event.text) : '';
    state.gist = state.type === 'gist' ? (msg.body.event && msg.body.event.text) : '';

    const response = await snippetController.saveSnippet(state);

    if (state.type === 'snippet') {
        msg.say(`Here's what you saved: \`${JSON.stringify(response)}\``);
    } else {
        msg.say(`Here's what you saved: \`\`\`${JSON.stringify(response)}\`\`\``);
    }
});



// Catch-all for any other responses not handled above
slapp.message('.*', ['direct_mention', 'direct_message'], (msg) => {
    // respond only 40% of the time
    if (Math.random() < 0.4) {
        msg.say([':wave:', ':pray:', ':raised_hands:'])
    }
});

// attach Slapp to express server
const server = slapp.attachToExpress(express());

server.get('/', function (req, res) {
    res.send('Hello');
});

// start http server
server.listen(port, (err) => {
    if (err) {
        return console.error(err);
    }
    console.log(`Listening on port ${port}`);
});