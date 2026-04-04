import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, ''),
  },
})

export async function sendVerificationEmail(
  to: string,
  username: string,
  token: string
) {
  const verifyUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`

  await transporter.sendMail({
    from: `"DEKpocarr" <${process.env.GMAIL_USER}>`,
    to,
    subject: 'ยืนยัน Email ของคุณ — DEKpocarr',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #FAF8F5; border-radius: 12px;">
        <h2 style="color: #2C2825; margin-bottom: 8px;">ยินดีต้อนรับสู่ DEKpocarr</h2>
        <p style="color: #5C4A32;">สวัสดี <strong>${username}</strong>,</p>
        <p style="color: #5C4A32;">กรุณายืนยัน email ของคุณโดยกดปุ่มด้านล่าง</p>
        <a href="${verifyUrl}"
           style="display: inline-block; margin: 24px 0; padding: 12px 24px;
                  background: #8B6F47; color: #FAF8F5; text-decoration: none;
                  border-radius: 8px; font-weight: 600;">
          ยืนยัน Email
        </a>
        <p style="color: #8C7B6B; font-size: 13px;">Link นี้จะหมดอายุใน 24 ชั่วโมง</p>
        <p style="color: #8C7B6B; font-size: 13px;">ถ้าไม่ได้สมัคร สามารถเพิกเฉยได้เลย</p>
      </div>
    `,
  })
}
