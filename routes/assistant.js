'use strict';

module.exports =  app => {
    app.post('/assistant/fullfill', app.oAuth.authorize(), (req, res) => {
        console.log('full-filling assistant request');
        console.log(JSON.stringify(res.locals.oauth.token.user, null, 2));

        res.send({
            requestId: req.body.requestId,
            payload: {
                agentUserId: res.locals.oauth.token.user
            }
        });
    });
}
