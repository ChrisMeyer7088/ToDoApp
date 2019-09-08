const express = require("express");
const router = express.Router();
const { createNewUser, getUser, checkUserCredentials } = require('../db/models/users')
const { createToken, checkForActiveToken, getAssociatedUser } = require('../db/models/token');

router.post('/register', (req, res, next) => {
    if(!req.body.username || !req.body.password) {
        res.status(400).json({
            type: "registration.register",
            data: {
                message: "Invalid Request"
            },
            success: true
        })
    }
    createNewUser(req.body.username, req.body.password)
    .then(() => res.status(200).json({
        type: "registration.register",
        data: {
            message: "User successfully registered"
        },
        success: true
    }))
    .catch(err => {
        console.error(err.stack);
        res.status(500).json({
            type: "registration.register",
            data: {
                message: "Registeration attempt failed"
            },
            success: false
        })
    })
})

router.post('/user', (req, res, next) => {
    if(!req.body.username) {
        res.status(400).json({
            type: "user.username",
            data: {
                message: "Invalid request sent",
                userExists: null
            },
            success: false
        })
    }
    getUser(req.body.username)
        .then(result => {
            if(result.rowCount === 0){
                res.status(200).json({
                    type: "user.username",
                    data: {
                        message: "Request successful",
                        userExists: false
                    },
                    success: true
                })
            } else {
                res.status(200).json({
                    type: "user.username",
                    data: {
                        message: "Request successful",
                        userExists: true
                    },
                    success: true
                })
            }
        })
        .catch(err => {
            res.status(500).json({
                type: "user.username",
                data: {
                    message: "Something went wrong",
                    userExists: null
                },
                success: false
            })
        })

})

router.post('/login', (req, res, next) => {
    if(!req.body.username || !req.body.password) {
        res.status(400).json({
            type: "user.login",
            data: {
                message: "Invalid request",
            },
            success: false
        })
        return;
    }
    let userId = ''
    //Retrieves The User entry if credentials are valid
    checkUserCredentials(req.body.username, req.body.password)
        .then(fetchedUserId => {
            if(fetchedUserId) {
                userId = fetchedUserId
                return checkForActiveToken(fetchedUserId)
            } else {
                res.status(200).json({
                    type: "user.login",
                    data: {
                        message: "Invalid credentials",
                        loggedIn: false
                    },
                    success: true
                })
                return;
            }
        })
        .then(resultQuery => {
            if(!resultQuery) return;
            //If no active tokens are found generate a token otherwise return the first active token
            if(resultQuery.rowCount === 0) {
                return createToken(userId)
            } else {
                res.status(200).json({
                    type: "user.login",
                    data: {
                        message: "Token Found",
                        loggedIn: true,
                        token: resultQuery.rows[0].value
                    },
                    success: true
                })
            }
        })
        .then(newTokenValue => {
            if(!newTokenValue) return;
            res.status(200).json({
                type: "user.login",
                data: {
                    message: "Credentials matched, token created",
                    loggedIn: true,
                    token: newTokenValue
                },
                success: true
            })
            return;
        })
        .catch(err => {
            console.log(err)
            res.status(500).json({
                type: "user.login",
                data: {
                    message: "Something went wrong",
                },
                success: false
            })
        })
})

module.exports = router;