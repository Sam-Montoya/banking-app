require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const Auth0Strategy = require('passport-auth0');
const massive = require('massive');
const session = require('express-session');

const app = express(bodyParser.json());

//CONNECTION TO THE DATABASE
massive(process.env.CONNECTIONSTRING).then(DB => {
    app.set('DB', DB);
}).catch(err => console.log('Connection To Database FAILED : ' + err));

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

//AUTHENTICATION
passport.use(new Auth0Strategy({
    domain: process.env.AUTH_DOMAIN,
    clientID: process.env.AUTH_CLIENTID,
    clientSecret: process.env.AUTH_CLIENTSECRET,
    callbackURL: process.env.AUTH_CALLBACK
}, function (accessToken, refreshToken, extraParams, profile, done) {
    const DB = app.get('DB');

    DB.find_user(profile.id).then(user => {
        if (user[0]) {
            return done(null, user);
        } else {    //CREATES A USER WITH THE DATABASE TABLE, THEN RETURNS IT
            DB.create_user([
                profile.displayName
                , profile.emails[0].value
                , profile.picture
                , profile.id
            ]).then(user => {
                return done(null, user[0]);
            })
        }
    });
}));

//THIS IS INVOKED ONE TIME TO SET THINGS UP
passport.serializeUser(function (user, done) {
    done(null, user);
});

//USER COMES FROM SESSION - THIS IS INVOKED FOR EVERY ENDPOINT
passport.deserializeUser(function (user, done) {
    app.get('DB').find_session_user(user[0].id).then(user => {
        return done(null, user[0]);
    });
});

app.get('/auth', passport.authenticate('auth0'));

app.get('/auth/callback', passport.authenticate('auth0', {
    successRedirect: 'http://localhost:3000/#/private',
    failureRedirect: 'http://localhost:3000/#/'
}));

app.get('/auth/me', (request, response) => {
    console.log('Full request: ' + request);
    console.log('user ' + request.user);
    if (!request.user) {
        return response.status(404).send('ERROR: User logged in or found.');
    } else {
        return response.status(200).send(request.user);
    }
});

app.get('/auth/logout', (request, response) => {
    request.logOut();   //PASSPORT GIVES US THIS TO TERMINATE A LOGIN SESSION.
    return response.redirect(302, 'http://localhost:3000/#/');
    //REDIRECT COMES FROM EXPRESS
    //302 IS THE DEFAULT REDIRECT STATUS CODE
});

const port = 3030;
app.listen(port, () => console.log('Im being hit on port ' + port));