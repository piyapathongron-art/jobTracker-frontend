interface JobFlexParams {
  role: string;
  company: string;
  location?: string | null;
  workMode?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  hrContact?: string | null;
  tokensInfo: string;
  source: string;
}

function flexRow(label: string, value: string) {
  return {
    type: "box",
    layout: "horizontal",
    contents: [
      { type: "text", text: label, size: "sm", color: "#888888", flex: 2 },
      { type: "text", text: value, size: "sm", wrap: true, flex: 3 },
    ],
  };
}

export function buildJobSavedFlex(p: JobFlexParams) {
  const workModeMap: Record<string, string> = { ONSITE: "ออฟฟิศ", REMOTE: "Remote", HYBRID: "Hybrid" };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: any[] = [
    flexRow("ตำแหน่ง", p.role),
    flexRow("บริษัท", p.company),
  ];
  if (p.location) rows.push(flexRow("ที่ตั้ง", p.location));
  if (p.workMode) rows.push(flexRow("รูปแบบงาน", workModeMap[p.workMode] ?? p.workMode));
  if (p.salaryMin || p.salaryMax) {
    const min = p.salaryMin?.toLocaleString() ?? "";
    const max = p.salaryMax?.toLocaleString() ?? "";
    const range = p.salaryMin && p.salaryMax ? `${min} – ${max}` : min || max;
    rows.push(flexRow("เงินเดือน", `${range} ${p.salaryCurrency ?? "THB"}`));
  }
  if (p.hrContact) rows.push(flexRow("ติดต่อ HR", p.hrContact));
  rows.push({ type: "separator", margin: "md" });
  rows.push({ type: "text", text: p.tokensInfo, size: "xs", color: "#aaaaaa", margin: "md", wrap: true });

  return {
    type: "flex",
    altText: `✅ บันทึกงาน: ${p.role} @ ${p.company}`,
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#27ACB2",
        paddingAll: "20px",
        contents: [
          { type: "text", text: `✅ บันทึกงาน${p.source}สำเร็จ`, color: "#ffffff", size: "lg", weight: "bold" },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: rows,
      },
    },
  };
}

/**
 * Standard text replies for the LINE bot.
 * Centralized here for easy modification of the Jobjab persona.
 */
export const LINE_REPLIES = {
  // --- Account Linking ---
  LINK_CODE_INVALID: "แง รหัส 6 หลักนี้ไม่ถูกต้องหรืออาจจะหมดอายุแล้วค่ะ ลองไปกด Generate Code มาใหม่จากหน้าเว็บ แล้วส่งให้น้องจ๊อบแจ๊บอีกทีนะคะ 🥺 (ERR: LINK_INVALID)",
  LINK_SUCCESS: (name: string) => `ผูกบัญชีเรียบร้อยจ้า! 👋 สวัสดีค่ะคุณ ${name} น้องจ๊อบแจ๊บพร้อมช่วยแล้ว ส่งลิงก์งาน รูปแคปหน้าจอ หรือพิมพ์บอกน้องตรงๆ ได้เลยนะคะ!`,
  NOT_LINKED: "อุ๊ย! คุณยังไม่ได้ผูกบัญชีเลยค่ะ 😅 รบกวนไปที่หน้าเว็บ JobTracker กดปุ่ม Generate Link Code แล้วเอาเลข 6 หลักมาส่งให้น้องตรงนี้ก่อนน้า (ERR: NOT_LINKED)",

  // --- Parsing & Scraping ---
  NO_SCRAPER: "แง้งงง ระบบหลังบ้านของน้องจ๊อบแจ๊บยังไม่ได้ตั้งค่าตัวอ่านเว็บค่ะ ฝากแคปรูป JD ส่งมาแทนไปก่อนนะคะ 🥺 (ERR: NO_SCRAPER)",
  SCRAPE_BLOCKED: "แง น้องจ๊อบแจ๊บเข้าเว็บนี้ไม่ได้ง่ะ เว็บเขาน่าจะบล็อกไว้ 😭 ฝากแคปรูป JD ส่งมาแทน หรือพิมพ์ข้อมูลเบื้องต้นมาให้น้องเซฟให้ก่อนได้นะคะ! (ERR: SCRAPE_BLOCKED)",
  SCRAPE_NO_CONTENT: "น้องจ๊อบแจ๊บพยายามอ่านเว็บนี้แล้ว แต่หาเนื้อหาไม่เจอเลยค่ะ 😭 แคปรูปส่งมาแทนน้องน่าจะอ่านง่ายกว่านะคะ (ERR: SCRAPE_EMPTY)",
  NOT_A_JOB: "เอ๊ะ... รูปหรือลิงก์นี้ดูเหมือนจะไม่ใช่ประกาศรับสมัครงานเลยนะคะ 😅 ลองเช็คดูอีกทีน้าา",

  // --- Job Saving Success/Error ---
  JOB_SAVED_URL: (role: string, company: string, tokensInfo: string) => 
    `✨ เย้! น้องจ๊อบแจ๊บเซฟงานจากลิงก์นี้ลงระบบให้เรียบร้อยแล้วนะคะ!\n${role} @ ${company}\n\n${tokensInfo}`,
  JOB_SAVED_URL_ERROR: "ง่ะ... เกิดข้อผิดพลาดตอนกำลังเซฟงานจากลิงก์นี้ค่ะ 😭 รบกวนก๊อปปี้เนื้อหา JD ไปแปะเองในเว็บก่อนน้า ขออภัยด้วยนะคะ 🙏 (ERR: URL_SAVE_FAILED)",
  
  JOB_SAVED_IMAGE: (role: string, company: string, tokensInfo: string) => 
    `✨ น้องจ๊อบแจ๊บเซฟงานจากรูปให้แล้วนะคะ! อย่าลืมเก็บ URL ไปกรอกในเว็บน้า จะได้ตามแทรคที่มาได้ง่ายๆ ค่ะ\n${role} @ ${company}\n\n${tokensInfo}`,
  JOB_SAVED_IMAGE_ERROR: "แง ภาพนี้ตัวหนังสืออ่านยากนิดนึง น้องจ๊อบแจ๊บแกะไม่ออกเลยค่ะ 🥺 ลองแคปมาใหม่ให้ชัดขึ้น หรือก๊อปข้อความส่งมาแทนได้น้า (ERR: IMG_PARSE_FAILED)",
  
  JOB_SAVED_TEXT: "\n\n✨ น้องจ๊อบแจ๊บเซฟงานนี้ลงระบบให้แล้วนะคะ!",
  MISSING_HR_CONTACT_WARNING: "\n\n⚠️ แจ้งเตือน: น้องจ๊อบแจ๊บหาช่องทางการติดต่อ HR (Email/LINE/เบอร์โทร) จากประกาศนี้ไม่เจอค่ะ อย่าลืมเข้าไปกรอกเพิ่มในหน้าเว็บน้า (หรือพิมพ์อัปเดตบอกน้องได้ค่ะ)",

  // --- Career Chat Fallbacks ---
  CHAT_FALLBACK: "ขอโทษน้า น้องจ๊อบแจ๊บยังไม่แน่ใจว่าจะตอบยังไงดีค่ะ ลองถามเรื่องเรซูเม่ สัมภาษณ์ หรือกลยุทธ์หางานได้นะคะ!",
  CHAT_ERROR: "แง น้องจ๊อบแจ๊บงงๆ ระบบประมวลผลขัดข้องนิดหน่อยค่ะ ลองส่งมาใหม่อีกทีนะคะ 🙏 (ERR: CHAT_FAILED)",
  
  // --- Help Command ---
  HELP_MESSAGE: "สวัสดีค่า! น้องจ๊อบแจ๊บคือ AI ผู้ช่วยหางานส่วนตัวของคุณนะคะ 💖\n\nตอนนี้น้องยังอยู่ในช่วง Beta (กำลังเรียนรู้งานอยู่ค่ะ 🐣) บางอย่างอาจจะยังไม่สมบูรณ์ 100%\n\nถ้าน้องตอบช้าหรืองงๆ แนะนำให้ไปใช้งานผ่านเว็บไซด์หลักของเราที่ https://job-tracker-psi-lilac.vercel.app/ จะชัวร์และครบถ้วนที่สุดเลยค่ะ!\n\nส่วนใน LINE นี้ คุณสามารถส่ง:\n🔗 ลิงก์รับสมัครงาน\n🖼️ รูปแคปหน้าจอ JD\n💬 พิมพ์บอกรายละเอียดงาน\nเพื่อให้น้องช่วยเซฟลงระบบได้เลยน้าา ✨"
};
