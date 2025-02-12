// server/src/passportConfig.js

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const KakaoStrategy = require("passport-kakao").Strategy;
const NaverStrategy = require("passport-naver").Strategy;

/**
 * Passport 초기화 함수
 *   - Google, Facebook, Kakao, Naver OAuth 전략을
 *     환경변수가 있을 때만 등록
 */
function initPassport() {
  // ======================
  // Google OAuth
  // ======================
  if (
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_CALLBACK_URL
  ) {
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
  } else {
    console.log(
      "[Passport] Skipping Google OAuth (missing GOOGLE_CLIENT_ID/SECRET/CALLBACK_URL)"
    );
  }

  // ======================
  // Facebook OAuth
  // ======================
  if (
    process.env.FACEBOOK_APP_ID &&
    process.env.FACEBOOK_APP_SECRET &&
    process.env.FACEBOOK_CALLBACK_URL
  ) {
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
  } else {
    console.log(
      "[Passport] Skipping Facebook OAuth (missing FACEBOOK_APP_ID/SECRET/CALLBACK_URL)"
    );
  }

  // ======================
  // Kakao OAuth
  // ======================
  if (
    process.env.KAKAO_CLIENT_ID &&
    process.env.KAKAO_CALLBACK_URL
    // Kakao는 clientSecret이 선택적이므로 별도 체크 X
  ) {
    passport.use(
      new KakaoStrategy(
        {
          clientID: process.env.KAKAO_CLIENT_ID,
          callbackURL: process.env.KAKAO_CALLBACK_URL,
          clientSecret: process.env.KAKAO_CLIENT_SECRET || "",
          // 카카오 앱에서 “client_secret” 사용을 설정했다면 사용
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
  } else {
    console.log(
      "[Passport] Skipping Kakao OAuth (missing KAKAO_CLIENT_ID/CALLBACK_URL)"
    );
  }

  // ======================
  // Naver OAuth
  // ======================
  if (
    process.env.NAVER_CLIENT_ID &&
    process.env.NAVER_CLIENT_SECRET &&
    process.env.NAVER_CALLBACK_URL
  ) {
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
  } else {
    console.log(
      "[Passport] Skipping Naver OAuth (missing NAVER_CLIENT_ID/SECRET/CALLBACK_URL)"
    );
  }

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
