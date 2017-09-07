require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const Auth0Strategy = require('passport-auth0');
const massive = require('massive');
const session = require('express-session');

const app = express(bodyParser.json());


massive(process.env.CONNECTIONSTRING).then(DB => {
    app.set('DB', DB);
}).catch(err => console.log('Connection To Database FAILED : ' + err));


const port = 3030;
app.listen(port, () => console.log('Im being hit on port ' + port));