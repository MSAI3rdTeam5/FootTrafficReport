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
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const app = express();

// 모든 라우트에 대해 CORS 및 보안 헤더 설정
app.use((req, res, next) => {
  // res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
  // res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  res.setHeader('Access-Control-Allow-Origin', 'https://msteam5iseeu.ddns.net');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// JSON 파싱 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 세션 설정 수정
app.use(
  session({
    secret: "your_session_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // 개발환경에서는 false
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24시간
    }
  })
);

// Passport 초기화
initPassport(); // passport.use(...) 등록
app.use(passport.initialize());
app.use(passport.session());

// 테스트용 라우트
app.get("/api/test", (req, res) => {
  res.json({ message: "Hello from Express server!" });
});


/**
 * --------------------------------------------
 *  Google One-Tap 로그인 라우트
 * --------------------------------------------
 */
// (1) One-Tap 로그인 라우트
app.post("/api/google-login", async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ error: "Missing credential" });
  }

  try {
    // 2) 구글 credential 검증
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload(); 
    // e.g. { email, name, picture, sub, ... }

    const email = payload.email;
    const name = payload.name || "Unknown User";
    const googleId = payload.sub; // 구글 고유ID

    // 3) Python 백엔드로 'member' 정보 조회
    //    /members?email=... 같은 라우트가 없으므로,
    //    우선 /members 전체를 가져오거나, /members/{id}가 아니라
    //    직접 filter 로직을 작성.
    // == 개선: Python 쪽에 /members/find?email=xxx 등의 라우트를 추가하는 편이 낫다.
    let memberId = null;

    // 간단 예시: /members (GET -> array)
    const membersRes = await fetch("https://msteam5iseeu.ddns.net/api/members");
    if (!membersRes.ok) {
      throw new Error(`Failed to fetch members: ${membersRes.status}`);
    }
    const members = await membersRes.json();
    // e.g. [ {id, email, name, subscription_plan}, ... ]

    // 이미 존재하는지 찾기
    let existingMember = members.find((m) => m.email === email);
    if (!existingMember) {
      // 4) 없으면 Python 백엔드에 신규 member 생성
      // Python에 POST /members? => 실제 구현 필요
      const createMemberRes = await fetch("https://msteam5iseeu.ddns.net/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email, 
          name,
          subscription_plan: "basic" // 예시
        }),
      });
      if (!createMemberRes.ok) {
        throw new Error(`Failed to create member: ${createMemberRes.status}`);
      }
      existingMember = await createMemberRes.json();
      // e.g. { id, email, name, subscription_plan }
    }

    memberId = existingMember.id;

    // 5) auth 테이블에 기록
    // Python 백엔드에 `/auth` POST가 있다고 가정 (create auth)
    // (실제 라우트명, 필드명에 맞춰 수정)
    const createAuthRes = await fetch("https://msteam5iseeu.ddns.net/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        member_id: memberId,
        provider: "google",
        access_token: credential,  // or payload.sub
        refresh_token: null
      })
    });
    if (!createAuthRes.ok) {
      // 409 or something
      console.warn("Failed to create auth record:", createAuthRes.status);
    } else {
      const authData = await createAuthRes.json();
      console.log("Created auth record:", authData);
    }

    // 6) Node.js 세션에 user 세팅 (Passport)
    const userObj = {
      id: memberId, 
      email: email,
      name: name
      // ... etc
    };
    req.login(userObj, (err) => {
      if (err) {
        return res.status(500).json({ error: "Session creation failed" });
      }
      return res.json({ success: true, user: userObj });
    });

  } catch (error) {
    console.error("Google login error:", error);
    return res.status(500).json({ error: "Server error" });
  }
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
// server/src/index.js
// ... 생략 (상단 import 및 기타 설정 부분은 그대로 유지)

if (
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET &&
  process.env.GOOGLE_CALLBACK_URL
) {
  // 구글 OAuth 시작 라우트
  app.get("/auth/google", (req, res, next) => {
    console.log("[Google OAuth] /auth/google route triggered");
    passport.authenticate("google", {
      scope: ["profile", "email"],
    })(req, res, next);
  });

  // 구글 OAuth 콜백 라우트 (Custom Callback)
  app.get("/auth/google/callback", (req, res, next) => {
    passport.authenticate("google", (err, user) => {
      if (err || !user) {
        return res.redirect("https://msteam5iseeu.ddns.net/login");
      }
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          return res.redirect("https://msteam5iseeu.ddns.net/login");
        }
        // 인증 성공 후 메인 페이지로 이동
        return res.redirect("https://msteam5iseeu.ddns.net/monitor");
      });
    })(req, res, next);
  });
} else {
  console.warn("[Google OAuth] 환경변수 설정 누락: GOOGLE_CLIENT_ID/SECRET/CALLBACK_URL");
  app.get("/auth/google", (req, res) => {
    res.status(501).json({ error: "Google OAuth not configured" });
  });
  app.get("/auth/google/callback", (req, res) => {
    res.status(501).json({ error: "Google OAuth not configured" });
  });
}

// ... 하단 나머지 라우트들은 그대로 유지


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
//  */
// app.use(express.static(path.join(__dirname, "../../client/dist")));

// // React SPA 라우팅
// app.get("*", (req, res) => {
//   console.log("[Express] Serving index.html for SPA routing");
//   res.sendFile(path.join(__dirname, "../../client/dist", "index.html"));
// });

// 포트 설정
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
