// server/src/index.js

const express = require("express");
const path = require("path");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
require("dotenv").config(); // .env 불러오기

const initPassport = require("./passportConfig");

// (추가) ffmpegRunner.js에서 startFfmpeg, getHlsUrl 가져오기
const { startFfmpeg, getHlsUrl } = require("./ffmpegRunner");

const app = express();

// (추가) JSON 바디 파싱
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
 *     유저 정보 반환 API
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
 * -----------------------------------------
 *     OAuth 라우트 + 디버깅 로그 (조건부)
 * -----------------------------------------
 */

/* ------------------
   1) Google OAuth
   ------------------ */
if (
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET &&
  process.env.GOOGLE_CALLBACK_URL
) {
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
} else {
  // 미설정 시 501 응답
  app.get("/auth/google", (req, res) => {
    res.status(501).json({ error: "Google OAuth not configured" });
  });
  app.get("/auth/google/callback", (req, res) => {
    res.status(501).json({ error: "Google OAuth not configured" });
  });
}

/* ------------------
   2) Facebook OAuth
   ------------------ */
if (
  process.env.FACEBOOK_APP_ID &&
  process.env.FACEBOOK_APP_SECRET &&
  process.env.FACEBOOK_CALLBACK_URL
) {
  app.get("/auth/facebook", passport.authenticate("facebook"));
  app.get(
    "/auth/facebook/callback",
    passport.authenticate("facebook", { failureRedirect: "/" }),
    (req, res) => {
      console.log("[Facebook OAuth] 인증 성공 => /monitor");
      res.redirect("/monitor");
    }
  );
} else {
  app.get("/auth/facebook", (req, res) => {
    res.status(501).json({ error: "Facebook OAuth not configured" });
  });
  app.get("/auth/facebook/callback", (req, res) => {
    res.status(501).json({ error: "Facebook OAuth not configured" });
  });
}

/* ------------------
   3) Kakao OAuth
   ------------------ */
if (
  process.env.KAKAO_CLIENT_ID &&
  process.env.KAKAO_CALLBACK_URL
) {
  app.get("/auth/kakao", passport.authenticate("kakao"));
  app.get(
    "/auth/kakao/callback",
    passport.authenticate("kakao", { failureRedirect: "/" }),
    (req, res) => {
      console.log("[Kakao OAuth] 인증 성공 => /monitor");
      res.redirect("/monitor");
    }
  );
} else {
  app.get("/auth/kakao", (req, res) => {
    res.status(501).json({ error: "Kakao OAuth not configured" });
  });
  app.get("/auth/kakao/callback", (req, res) => {
    res.status(501).json({ error: "Kakao OAuth not configured" });
  });
}

/* ------------------
   4) Naver OAuth
   ------------------ */
if (
  process.env.NAVER_CLIENT_ID &&
  process.env.NAVER_CLIENT_SECRET &&
  process.env.NAVER_CALLBACK_URL
) {
  app.get("/auth/naver", passport.authenticate("naver"));
  app.get(
    "/auth/naver/callback",
    passport.authenticate("naver", { failureRedirect: "/" }),
    (req, res) => {
      console.log("[Naver OAuth] 인증 성공 => /monitor");
      res.redirect("/monitor");
    }
  );
} else {
  app.get("/auth/naver", (req, res) => {
    res.status(501).json({ error: "Naver OAuth not configured" });
  });
  app.get("/auth/naver/callback", (req, res) => {
    res.status(501).json({ error: "Naver OAuth not configured" });
  });
}

/**
 * ------------------------------------------------
 *  1) 카메라 등록 API (RTSP -> HLS)
 * ------------------------------------------------
 */
app.post("/api/cameras", (req, res) => {
  // 예: req.body = { cameraId: "cam01", rtspUrl: "rtsp://..." }
  const { cameraId, rtspUrl } = req.body;
  if (!cameraId || !rtspUrl) {
    return res.status(400).json({ error: "cameraId and rtspUrl are required" });
  }

  console.log(`[Camera API] /api/cameras POST -> cameraId=${cameraId}, rtspUrl=${rtspUrl}`);

  // FFmpeg 스폰하여 RTSP -> HLS 변환
  startFfmpeg(cameraId, rtspUrl);

  // 프론트엔드에서 이 URL로 재생 가능
  const hlsUrl = getHlsUrl(cameraId);

  // 응답
  res.json({
    success: true,
    cameraId,
    hlsUrl,
    message: `Camera ${cameraId} started HLS streaming.`,
  });
});

/**
 * ------------------------------------------------
 *  2) HLS 정적 서빙
 *  - ffmpegRunner.js가 /server/src/hls/cameraId/playlist.m3u8 생성
 * ------------------------------------------------
 */
app.use(
  "/hls",
  express.static(path.join(__dirname, "hls"), {
    setHeaders: (res, filePath) => {
      // HLS 세그먼트 .ts, .m3u8 캐싱 방지
      res.set("Cache-Control", "no-store");
    },
  })
);

/**
 * ------------------------------------------------
 * 정적 파일 서빙 (React 빌드 결과)
 *  - __dirname === "C:/.../server/src"
 *  - "../../client/dist" => "C:/.../frontend/client/dist"
 * ------------------------------------------------
 */
app.use(express.static(path.join(__dirname, "../../client/dist")));

// React SPA 라우팅
app.get("*", (req, res) => {
  console.log("[Express] Serving index.html for SPA routing");
  res.sendFile(path.join(__dirname, "../../client/dist", "index.html"));
});

// 포트 설정
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
