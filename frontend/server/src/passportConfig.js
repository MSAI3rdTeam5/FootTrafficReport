// server/src/passportConfig.js

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const KakaoStrategy = require("passport-kakao").Strategy;
const NaverStrategy = require("passport-naver").Strategy;

/**
 * Passport 초기화 함수
 *   - Google, Facebook, Kakao, Naver OAuth 전략 등록
 */
function initPassport() {
  // ======================
  // Google OAuth
  // ======================
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      (accessToken, refreshToken, profile, done) => {
        // profile에 구글 사용자 정보가 들어 있음
        const user = {
          provider: "google",
          id: profile.id,
          displayName: profile.displayName || "GoogleUser",
        };
        return done(null, user);
      }
    )
  );

  // ======================
  // Facebook OAuth
  // ======================
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: process.env.FACEBOOK_CALLBACK_URL,
      },
      (accessToken, refreshToken, profile, done) => {
        // profile에서 페이스북 사용자 정보 추출
        const user = {
          provider: "facebook",
          id: profile.id,
          displayName: profile.displayName || "FacebookUser",
        };
        return done(null, user);
      }
    )
  );

  // ======================
  // Kakao OAuth
  // ======================
  passport.use(
    new KakaoStrategy(
      {
        clientID: process.env.KAKAO_CLIENT_ID,
        callbackURL: process.env.KAKAO_CALLBACK_URL,
        clientSecret: process.env.KAKAO_CLIENT_SECRET || "", 
        // 카카오 앱에서 “client_secret” 사용을 설정했다면 필요
      },
      (accessToken, refreshToken, profile, done) => {
        // profile에서 카카오 사용자 정보 추출
        const user = {
          provider: "kakao",
          id: profile.id,
          displayName: profile.username || "KakaoUser",
        };
        return done(null, user);
      }
    )
  );

  // ======================
  // Naver OAuth
  // ======================
  passport.use(
    new NaverStrategy(
      {
        clientID: process.env.NAVER_CLIENT_ID,
        clientSecret: process.env.NAVER_CLIENT_SECRET,
        callbackURL: process.env.NAVER_CALLBACK_URL,
      },
      (accessToken, refreshToken, profile, done) => {
        // profile에서 네이버 사용자 정보 추출
        const user = {
          provider: "naver",
          id: profile.id,
          displayName: profile.displayName || "NaverUser",
        };
        return done(null, user);
      }
    )
  );

  // =============
  // 세션 직렬화
  // =============
  passport.serializeUser((user, done) => {
    // user 객체 전체를 세션에 저장하거나, user.id만 따로 저장 가능
    done(null, user);
  });

  passport.deserializeUser((obj, done) => {
    // 세션에서 꺼낸 user 객체를 req.user로 사용
    done(null, obj);
  });
}

module.exports = initPassport;
