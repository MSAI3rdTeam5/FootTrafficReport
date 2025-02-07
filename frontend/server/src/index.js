// server/src/index.js

const express = require("express");
const path = require("path");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
require("dotenv").config(); // .env 불러오기

const initPassport = require("./passportConfig");

const app = express();

// 세션 미들웨어 (OAuth 로그인 세션 유지 용)
app.use(
  session({
    secret: "someSessionSecretKey", // 실제 운영에선 안전한 값으로
    resave: false,
    saveUninitialized: false,
  })
);

// Passport 초기화
initPassport(); // passport.use(...) 등록
app.use(passport.initialize());
app.use(passport.session());

// CORS 설정 (프론트/백 분리 시)
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

// 테스트용 라우트
app.get("/api/test", (req, res) => {
  res.json({ message: "Hello from Express server!" });
});

/**
 * -----------------------------
 *     유저 정보 반환 API 추가
 * -----------------------------
 */
app.get("/api/user", (req, res) => {
  console.log("[/api/user] req.user =", req.user);

  if (!req.user) {
    // 로그인 안 된 상태
    return res.status(401).json({ error: "Not logged in" });
  }

  // 로그인된 사용자 => displayName 반환
  res.json({ displayName: req.user.displayName });
});

/**
 * -----------------------------
 *     OAuth 라우트 + 디버깅 로그
 * -----------------------------
 */

// [1] Google OAuth 라우트
app.get("/auth/google", (req, res, next) => {
  console.log("[Google OAuth] /auth/google route triggered");
  passport.authenticate("google", { scope: ["profile"] })(req, res, next);
});

app.get("/auth/google/callback", (req, res, next) => {
  console.log("[Google OAuth] /auth/google/callback route triggered");

  // Custom Callback 방식
  passport.authenticate("google", (err, user, info) => {
    if (err) {
      console.log("[Google OAuth] error:", err);
      return next(err);
    }
    if (!user) {
      console.log("[Google OAuth] No user => 로그인 실패 => redirect /");
      return res.redirect("/");
    }
    // 로그인 성공
    console.log("[Google OAuth] 성공 => user:", user);  

    // 세션에 user 저장
    req.logIn(user, (loginErr) => {
      if (loginErr) {
        console.log("[Google OAuth] req.logIn error:", loginErr);
        return next(loginErr);
      }
      console.log("[Google OAuth] req.logIn 성공 => /monitor로 redirect");
      return res.redirect("/monitor");
    });
  })(req, res, next);
});

// [2] 페이스북 OAuth 라우트
app.get("/auth/facebook", passport.authenticate("facebook"));
app.get(
  "/auth/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "/" }),
  (req, res) => {
    console.log("[Facebook OAuth] 인증 성공 => /monitor");
    res.redirect("/monitor");
  }
);

// [3] 카카오 OAuth 라우트
app.get("/auth/kakao", passport.authenticate("kakao"));
app.get(
  "/auth/kakao/callback",
  passport.authenticate("kakao", { failureRedirect: "/" }),
  (req, res) => {
    console.log("[Kakao OAuth] 인증 성공 => /monitor");
    res.redirect("/monitor");
  }
);

// [4] 네이버 OAuth 라우트
app.get("/auth/naver", passport.authenticate("naver"));
app.get(
  "/auth/naver/callback",
  passport.authenticate("naver", { failureRedirect: "/" }),
  (req, res) => {
    console.log("[Naver OAuth] 인증 성공 => /monitor");
    res.redirect("/monitor");
  }
);

/**
 * 정적 파일 서빙 (React 빌드 결과)
 *   - client/dist 폴더를 정적으로 서빙
 */
app.use(express.static(path.join(__dirname, "../../client/dist")));

// React SPA를 위해 나머지 경로는 index.html 반환
app.get("*", (req, res) => {
  console.log("[Express] Serving index.html for SPA routing");
  res.sendFile(path.join(__dirname, "../../client/dist", "index.html"));
});

// 포트 설정
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
