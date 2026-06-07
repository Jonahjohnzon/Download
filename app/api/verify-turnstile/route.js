export async function POST(req) {
  const { token } = await req.json();

  if (!token) {
    return Response.json(
      { success: false, error: "Missing token" },
      { status: 400 }
    );
  }

  const formData = new URLSearchParams();
  formData.append("secret", process.env.TURNSTILE_SECRET);
  formData.append("response", token);

  const result = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await result.json();

  if (!data.success) {
    return Response.json(
      { success: false, error: "Bot detected" },
      { status: 403 }
    );
  }

  return Response.json({ success: true });
}