const expect = require("chai").expect;
var { createNewUser,
    getUser,
    checkUserCredentials,
    removeUserByUsername } = require("../db/models/users");

describe("#userDBQueries", () => {
    context("Creates a valid User Object in the db", () => {
        let username = "TestUser1";
        let password = "Asdy12sua";
        after("Deletes the user added", () => {
            return removeUserByUsername(username)
                .catch(err => console.error(err))
        })
        it("Adds a valid user to the database", () => {
            return createNewUser(username, password)
                .then(result => {
                    expect(result.rowCount).to.equal(1)
                })
        })
    })
    context("Removes a valid User Object", () => {
        let username = "TestUser2";
        let password = "Asdy12sua";
        before("Adds the mock user to database", () => {
            return createNewUser(username, password)
                .catch(err => console.error(err))
        })
        it("Removes a valid user from the database", () => {
            return removeUserByUsername(username)
                .then(result => {
                    expect(result.rowCount).to.equal(1)
                })
        })
    })
    context("User Credential Authorization", () => {
        let username = "TestUser3";
        let password = "Asdy12sua";
        before("Adds the mock user to database", () => {
            return createNewUser(username, password)
                .catch(err => console.error(err))
        })
        after("Deletes the user added", () => {
            return removeUserByUsername(username)
                .catch(err => console.error(err))
        })
        it("Verifies the user credentials", () => {
            return checkUserCredentials(username, password)
                .then(userId => {
                    expect(userId).to.be.ok;
                })
        })
    })
})