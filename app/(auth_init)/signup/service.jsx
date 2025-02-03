"use client";

// 若不想讓它在瀏覽器顯示 (例如要存密鑰) 則改用 server action 或 server component
export async function register(formData) {
  try {
    // 1. 組裝參數
    const email = formData.get("email");
    const password = formData.get("password");
    const username = formData.get("username");

    // 2. 發送 fetch 到後端
    const response = await fetch(
      "http://140.118.162.94:30000/api/1.0/metadata_mgt/UserManager/create_user",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, username }),
      }
    );

    // 3. 依狀態碼或後端回傳 JSON 進行判斷
    if (response.status === 400) {
      return { status: "user_exists" };
    }

    // 假設後端成功就回傳 success
    return { status: "success" };
  } catch (error) {
    // 可以加強 log
    return { status: "failed" };
  }
}
