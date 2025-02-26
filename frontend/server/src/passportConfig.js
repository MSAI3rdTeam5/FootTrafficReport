// server/src/passportConfig.js

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

function initPassport() {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // 여기서 profile 정보를 DB에 저장하거나,
          // 이미 있는 사용자면 조회 후 done(null, user);
          // 새 사용자면 생성 후 done(null, user); 하는 로직을 작성하세요.
          return done(null, profile);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );

  // 세션에 사용자 정보를 저장(serialize)하는 방법 정의
  passport.serializeUser((user, done) => {
    // user 객체에서 DB의 user.id 등을 꺼내 세션에 저장
    done(null, user);
  });

  // 세션에서 식별자(id)를 꺼내 실제 사용자 정보 복원(deserialize)하는 방법 정의
  passport.deserializeUser((obj, done) => {
    // 일반적으로 DB에서 user를 조회한 뒤 done(null, user)를 호출
    // 여기서는 예시로 obj 자체가 user라고 가정
    done(null, obj);
  });
}

module.exports = initPassport;