// client/src/utils/apiWrapper.js

import { logoutUser, refreshAccessToken, getAccessToken } from "./auth";

export async function apiRequest(url, options = {}) {
  if (!options.headers) options.headers = {};

  let token = getAccessToken();

  if (token) {
    options.headers["Authorization"] = `Bearer ${token}`;
  }
  options.headers["Content-Type"] = "application/json";

  // 1) 첫 요청
  let response;
  try {
    response = await fetch(url, options);
  } catch (err) {
    console.error("Network error:", err);
    throw err;
  }

  // 2) 만약 401 => Access Token 만료 (or invalid)
  if (response.status === 401) {
    console.warn("[apiRequest] 401 => Trying refresh token...");
    const newToken = await refreshAccessToken();
    if (!newToken) {
      // refresh token 없음 -> logout
      console.warn("Refresh token failed. Logging out user.");
      logoutUser();
      window.location.href = "/";
      return null;
    }

    // 2-1) Refresh 성공 => newToken으로 재시도
    options.headers["Authorization"] = `Bearer ${newToken}`;
    response = await fetch(url, options);
    if (response.status === 401) {
      // refresh 실패, 재시도도 401 => Logout
      logoutUser();
      window.location.href = "/";
      return null;
    }
  }

  // 3) 처리
  if (!response.ok) {
    // 4xx, 5xx 등
    throw new Error(`Request failed with status ${response.status}`);
  }
  // 4) 정상 응답
  const data = await response.json();
<<<<<<< HEAD
  console.log("profile data:", data);
=======
>>>>>>> hotfix
  return data;
}