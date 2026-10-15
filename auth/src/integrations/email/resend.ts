type ResendEmail = {
  to: string;
  subject: string;
  text: string;
  html: string;
  alias?: string;
};

const resendEndpoint = "https://api.resend.com/emails";

export async function sendResendEmail(email: ResendEmail) {
  const apiKey = process.env.RESEND_API_KEY;
  const domain = process.env.AUTH_EMAIL_DOMAIN;

  if (!apiKey) {
    throw new Error("Email can't be sent: RESEND_API_KEY is not configured.");
  }

  if (!domain) {
    throw new Error("Email can't be sent: AUTH_EMAIL_DOMAIN is not configured.");
  }

  const { alias = "no-reply", ...message } = email;

  const response = await fetch(resendEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${alias}@${domain}`,
      ...message,
    }),
  });

  if (!response.ok) {
    console.error("Resend rejected an email request.", {
      status: response.status,
    });
    throw new Error("Email can't be sent. Check the Resend configuration.");
  }
}
