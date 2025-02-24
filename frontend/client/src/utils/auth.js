// client/src/utils/auth.js

// ------------------------------
// 저장 / 불러오기 / 삭제
// ------------------------------
// Access Token을 localStorage에 저장
export function storeAccessToken(token) {
    localStorage.setItem("access_token", token);
  }
  
  // Refresh Token을 localStorage에 저장
  export function storeRefreshToken(token) {
    localStorage.setItem("refresh_token", token);
  }
  
  // 저장된 Access Token 불러오기
  export function getAccessToken() {
    return localStorage.getItem("access_token");
  }
  
  // 저장된 Refresh Token 불러오기
  export function getRefreshToken() {
    return localStorage.getItem("refresh_token");
  }
  
  // 모든 토큰 및 사용자 정보 제거
  export function logoutUser() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    // 혹시 다른 사용자 정보도 있으면 지움.
    // localStorage.removeItem("user_profile");
    // 세션/쿠키 등도 같이 정리할 수 있음
  }
  
  // ------------------------------
  // 토큰 헤더를 준비 함수
  // ------------------------------
  export function getAuthHeaders() {
    const token = getAccessToken();
    const headers = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }
  
  
  // ------------------------------
  // 로그인 함수 (예: POST /api/login)
  // ------------------------------
  export async function loginUser(email, password) {
      const url = "https://msteam5iseeu.ddns.net/api/login"; // Python /login 엔드포인트
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (!response.ok) {
          throw new Error(`Login failed: ${response.status}`);
        }
        const data = await response.json();
        // data: { access_token: "jwt_string", token_type: "bearer" }
        // 토큰 저장 (localStorage, 또는 다른 스토리지)
        storeAccessToken(data.access_token);
        storeRefreshToken(data.refresh_token)
        console.log("Login success. Two Token saved.");
        return data;
      } catch (error) {
        console.error("Error during login:", error);
        throw error;
      }
  }
  
  // ------------------------------
  // Refresh Access Token
  //  => /api/refresh
  // ------------------------------
  export async function refreshAccessToken() {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      console.warn("No refresh token found");
      return null;
    }
    try {
      const response = await fetch("https://msteam5iseeu.ddns.net/api/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!response.ok) {
        console.warn("Refresh token request failed:", response.status);
        return null;
      }
      const data = await response.json();
      // data = { access_token: "newly_issued_access_token" }
      if (data.access_token) {
        storeAccessToken(data.access_token);
        console.log("Access token refreshed");
        return data.access_token;
      }
      return null;
    } catch (err) {
      console.error("Error refreshing token:", err);
      return null;
    }
  }