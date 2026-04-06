const DAILY_PHRASES = [
  { phrase: "What's your plan here?", thai: "แผนของคุณในจุดนี้คืออะไร?", use: "โค้ชถามก่อนที่คุณจะตัดสินใจ" },
  { phrase: "Walk me through your thought process.", thai: "อธิบายกระบวนการคิดของคุณให้ฟังหน่อย", use: "โค้ชขอให้อธิบายทีละขั้น" },
  { phrase: "What are you trying to accomplish here?", thai: "คุณพยายามจะทำอะไรให้สำเร็จ?", use: "โค้ชถามเป้าหมายของ action" },
  { phrase: "I would argue that...", thai: "ผมคิดว่า... (แบบมีเหตุผลสนับสนุน)", use: "โค้ชเสนอความเห็นต่างอย่างสุภาพ" },
  { phrase: "The reason why I like this bet is...", thai: "เหตุผลที่ผมชอบ bet นี้คือ...", use: "โค้ชอธิบายเหตุผลที่เป็นรูปธรรม" },
  { phrase: "Given that his range is capped...", thai: "เมื่อพิจารณาว่า range ของเขาถูก cap...", use: "โค้ชตั้งสมมติฐานก่อนวิเคราะห์" },
  { phrase: "You're essentially saying that...", thai: "สิ่งที่คุณกำลังบอกอยู่จริงๆ คือ...", use: "โค้ชสรุปความหมายเบื้องหลัง action" },
  { phrase: "Does that make sense to you?", thai: "เข้าใจไหม?", use: "โค้ชเช็คความเข้าใจหลังอธิบาย" },
  { phrase: "I think you're underestimating his range.", thai: "ผมคิดว่าคุณประเมิน range ต่ำเกินไป", use: "โค้ช challenge การอ่าน range" },
  { phrase: "This is a spot where you can over-bluff.", thai: "นี่คือจุดที่คุณอาจ bluff มากเกินไป", use: "โค้ชเตือนเรื่อง bluff frequency" },
  { phrase: "Let's think about this from his perspective.", thai: "ลองคิดจากมุมมองของเขาดู", use: "โค้ชให้เปลี่ยนมุมมองไปคิดแทนคู่ต่อสู้" },
  { phrase: "The issue I have with this line is...", thai: "ปัญหาที่ผมมีกับการเล่นแบบนี้คือ...", use: "โค้ชวิจารณ์อย่างสุภาพและเฉพาะจุด" },
  { phrase: "In theory, you should be mixing here.", thai: "ในทางทฤษฎี คุณควร mix action ที่นี่", use: "โค้ชอ้างถึง GTO mixed strategy" },
  { phrase: "That's a valid point, but consider this...", thai: "นั่นเป็นประเด็นที่ถูกต้อง แต่ลองพิจารณา...", use: "โค้ชยอมรับบางส่วนแต่เพิ่มมุมมอง" },
  { phrase: "You're putting him in a really tough spot.", thai: "คุณกำลังทำให้เขาอยู่ในสถานการณ์ยาก", use: "โค้ชชมเมื่อสร้าง pressure ที่ดี" },
  { phrase: "What's the worst thing that can happen?", thai: "อะไรคือสิ่งที่แย่ที่สุดที่จะเกิดขึ้น?", use: "โค้ชให้คิดถึง downside ของ action" },
  { phrase: "How does the turn card change things?", thai: "ไพ่ turn เปลี่ยนสถานการณ์อย่างไร?", use: "โค้ชให้วิเคราะห์ผลของ runout" },
  { phrase: "You have to balance your checking range.", thai: "คุณต้อง balance checking range ด้วย", use: "โค้ชแนะนำให้ใส่มือดีใน checking range" },
  { phrase: "What hands are you trying to get value from?", thai: "คุณพยายาม get value จากมือไหน?", use: "โค้ชให้ระบุ value targets ก่อน bet" },
  { phrase: "Let's run through the range breakdown together.", thai: "มา breakdown range กันทีละส่วน", use: "โค้ชเสนอให้วิเคราะห์ range อย่างเป็นระบบ" },
];

export default function PhraseOfTheDay() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  const p = DAILY_PHRASES[dayOfYear % DAILY_PHRASES.length];

  return (
    <div className="bg-surface border border-accent/20 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">💬</span>
        <h3 className="text-sm font-semibold text-accent uppercase tracking-wider">
          Phrase of the Day
        </h3>
      </div>

      <p className="text-lg font-semibold text-white mb-1">
        &ldquo;{p.phrase}&rdquo;
      </p>
      <p className="text-sm text-accent mb-3">{p.thai}</p>
      <p className="text-xs text-muted border-t border-border pt-3">
        <span className="text-gray-400 font-medium">ใช้เมื่อ: </span>{p.use}
      </p>
    </div>
  );
}
