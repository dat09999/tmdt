import { useEffect } from "react";
import { handleGoogleSuccessToken } from "../utils/auth";

export default function OAuth2SuccessPage() {
  useEffect(() => {
    handleGoogleSuccessToken().then((token) => {
      window.location.href = token ? "/" : "/login";
    });
  }, []);

  return <div>Đang xử lý đăng nhập Google...</div>;
}
