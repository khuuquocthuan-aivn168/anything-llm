const fs = require("fs");
const path = require("path");

const { buildVnAdminDocx } = require("./vn-admin-utils.js");
const { loadLibraries } = require("./utils.js");

async function run() {
  const libs = await loadLibraries();
  const docx = libs.docx;
  
  // Test 1: Quyết định (Named document)
  const paramsQd = {
    documentType: "quyet-dinh",
    parentAgency: "BỘ KHOA HỌC VÀ CÔNG NGHỆ",
    issuingAgency: "TỔNG CỤC TIÊU CHUẨN ĐO LƯỜNG CHẤT LƯỢNG",
    documentNumber: "123",
    symbol: "QĐ-TĐC",
    location: "Hà Nội",
    date: "2023-10-25",
    title: "Về việc thành lập hội đồng thi đua",
    legalBasis: ["Căn cứ Luật A", "Căn cứ Luật B"],
    content: "<h1>Điều 1</h1><p>Thành lập hội đồng.</p>",
    signerTitle: "TỔNG CỤC TRƯỞNG",
    signerName: "Nguyễn Văn A",
    recipients: ["Như Điều 1;", "Lưu VT."]
  };

  try {
    const docQd = await buildVnAdminDocx(docx, paramsQd, libs, console.log);
    const bufferQd = await docx.Packer.toBuffer(docQd);
    fs.writeFileSync("/tmp/test_quyet_dinh.docx", bufferQd);
    console.log("Quyết định generated successfully. Size:", bufferQd.length);
  } catch (err) {
    console.error("Error generating Quyết định:", err);
  }

  // Test 2: Công văn (Unnamed document, missing some fields to test fallbacks)
  const paramsCv = {
    documentType: "cong-van",
    // Missing parentAgency, issuingAgency, symbol, location to test placeholders
    documentNumber: "456", 
    date: "2023-11-01",
    title: "Đề nghị cấp kinh phí", // This should appear under the number
    content: "<p>Kính gửi ABC,</p><p>Chúng tôi đề nghị cấp kinh phí...</p>",
    // Missing signerTitle, signerName, recipients
  };

  try {
    const docCv = await buildVnAdminDocx(docx, paramsCv, libs, console.log);
    const bufferCv = await docx.Packer.toBuffer(docCv);
    fs.writeFileSync("/tmp/test_cong_van.docx", bufferCv);
    console.log("Công văn generated successfully. Size:", bufferCv.length);
  } catch (err) {
    console.error("Error generating Công văn:", err);
  }
}

run();
