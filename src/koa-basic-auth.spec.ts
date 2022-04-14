import Koa from "koa";
import Router from "koa-router";
import supertest from "supertest";
import koaBasicAuth from "./koa-basic-auth";
import { safeCompare } from "./authorizer";

describe("koa-basic-auth", function () {
  const app = newTestApp();

  describe("safe compare", function () {
    it("should return false on different inputs", function () {
      expect(safeCompare("user-input", "secret-value")).toBeFalsy();
    });

    it("should return false on different inputs", function () {
      expect(safeCompare("currectvalue", "currectvalue")).toBeTruthy();
    });
  });

  describe("static users", function () {
    const endpoint = "/static";

    it("should reject on missing header", function (done) {
      supertest(app.callback()).get(endpoint).expect(401, done);
    });

    it("should reject on wrong credentials", function (done) {
      supertest(app.callback())
        .get(endpoint)
        .auth("dude", "stuff")
        .expect(401, done);
    });

    it("should reject on shorter prefix", function (done) {
      supertest(app.callback())
        .get(endpoint)
        .auth("Admin", "secret")
        .expect(401, done);
    });

    it("should reject without challenge", function (done) {
      supertest(app.callback())
        .get(endpoint)
        .auth("dude", "stuff")
        .expect(function (res) {
          if (res.headers["WWW-Authenticate"])
            throw new Error("Response should not have a challenge");
        })
        .expect(401, done);
    });

    it("should accept correct credentials", function (done) {
      supertest(app.callback())
        .get(endpoint)
        .auth("Admin", "secret1234")
        .expect(200, "OK", done);
    });
  });

  describe("custom authorizer", function () {
    const endpoint = "/custom";

    it("should reject on missing header", function (done) {
      supertest(app.callback()).get(endpoint).expect(401, done);
    });

    it("should reject on wrong credentials", function (done) {
      supertest(app.callback())
        .get(endpoint)
        .auth("dude", "stuff")
        .expect(401, done);
    });

    it("should accept fitting credentials", function (done) {
      supertest(app.callback())
        .get(endpoint)
        .auth("Aloha", "secretverymuch")
        .expect(200, "OK", done);
    });

    describe("with safe compare", function () {
      const endpoint = "/custom-compare";

      it("should reject wrong credentials", function (done) {
        supertest(app.callback())
          .get(endpoint)
          .auth("bla", "blub")
          .expect(401, done);
      });

      it("should reject prefix credentials", function (done) {
        supertest(app.callback())
          .get(endpoint)
          .auth("Test", "test")
          .expect(401, done);
      });

      it("should accept fitting credentials", function (done) {
        supertest(app.callback())
          .get(endpoint)
          .auth("Testeroni", "testsecret")
          .expect(200, "OK", done);
      });
    });
  });

  describe("async authorizer", function () {
    const endpoint = "/async";

    it("should reject on missing header", function (done) {
      supertest(app.callback()).get(endpoint).expect(401, done);
    });

    it("should reject on wrong credentials", function (done) {
      supertest(app.callback())
        .get(endpoint)
        .auth("dude", "stuff")
        .expect(401, done);
    });

    it("should accept fitting credentials", function (done) {
      supertest(app.callback())
        .get(endpoint)
        .auth("Aererer", "secretiveStuff")
        .expect(200, "OK", done);
    });
  });

  describe("continue or not if unauthorized", function () {
    it("should reject but continue and send custom message", function (done) {
      supertest(app.callback())
        .get("/continue")
        .auth("Bar", "bar")
        .expect(200, "OK", done);
    });
  });

  describe("challenge", function () {
    it("should reject with blank challenge", function (done) {
      supertest(app.callback())
        .get("/challenge")
        .expect("WWW-Authenticate", "Basic")
        .expect(401, done);
    });

    it("should reject with custom realm challenge", function (done) {
      supertest(app.callback())
        .get("/realm")
        .expect("WWW-Authenticate", 'Basic realm="test"')
        .expect(401, done);
    });

    it("should reject with custom generated realm challenge", function (done) {
      supertest(app.callback())
        .get("/realmfunction")
        .expect("WWW-Authenticate", 'Basic realm="bla"')
        .expect(401, done);
    });
  });
});

function newTestApp() {
  const app = new Koa();
  const router = new Router();

  //Requires basic auth with username 'Admin' and password 'secret1234'
  const staticUserAuth = koaBasicAuth({
    users: {
      Admin: "secret1234",
    },
    challenge: false,
  });

  //Uses a custom (synchronous) authorizer function
  const customAuthorizerAuth = koaBasicAuth({
    users: {},
    authorizer: testAuthorizer,
  });

  //Uses a custom (synchronous) authorizer function
  const customCompareAuth = koaBasicAuth({
    users: {},
    authorizer: testComparingAuthorizer,
  });

  //Same, but sends a basic auth challenge header when authorization fails
  const challengeAuth = koaBasicAuth({
    users: {},
    authorizer: testAuthorizer,
    challenge: true,
  });

  //Uses a custom asynchronous authorizer function
  const asyncAuth = koaBasicAuth({
    users: {},
    authorizer: testAsyncAuthorizer,
  });

  //Uses a custom response body function
  const continueAuth = koaBasicAuth({
    users: { Foo: "bar" },
    continueIfUnauthorized: true,
  });

  //Uses a custom realm
  const realmAuth = koaBasicAuth({
    users: {},
    challenge: true,
    realm: "test",
  });

  //Uses a custom realm function
  const realmFunctionAuth = koaBasicAuth({
    users: {},
    challenge: true,
    realm: function () {
      return "bla";
    },
  });

  router.get("/static", staticUserAuth, function (ctx) {
    ctx.status = 200;
    ctx.body = "OK";
  });

  router.get("/custom", customAuthorizerAuth, function (ctx) {
    ctx.status = 200;
    ctx.body = "OK";
  });

  router.get("/custom-compare", customCompareAuth, function (ctx) {
    ctx.status = 200;
    ctx.body = "OK";
  });

  router.get("/challenge", challengeAuth, function (ctx) {
    ctx.status = 200;
    ctx.body = "OK";
  });

  router.get("/async", asyncAuth, function (ctx) {
    ctx.status = 200;
    ctx.body = "OK";
  });

  router.get("/continue", continueAuth, function (ctx) {
    ctx.status = 200;
    ctx.body = "OK";
  });

  router.get("/realm", realmAuth, function (ctx) {
    ctx.status = 200;
    ctx.body = "OK";
  });

  router.get("/realmfunction", realmFunctionAuth, function (ctx) {
    ctx.status = 200;
    ctx.body = "OK";
  });

  app.use(router.allowedMethods()).use(router.routes());
  return app;
}

//Custom authorizer checking if the username starts with 'A' and the password with 'secret'
function testAuthorizer(username: string, password: string) {
  return username.startsWith("A") && password.startsWith("secret");
}

//Same but asynchronous
async function testAsyncAuthorizer(username: string, password: string) {
  return username.startsWith("A") && password.startsWith("secret");
}

function testComparingAuthorizer(username: string, password: string) {
  return (
    safeCompare(username, "Testeroni") && safeCompare(password, "testsecret")
  );
}
