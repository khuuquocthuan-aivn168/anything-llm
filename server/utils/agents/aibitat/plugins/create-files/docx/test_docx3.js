const fs = require("fs");
const path = require("path");

const { buildVnAdminDocx } = require("./vn-admin-utils.js");
const { loadLibraries } = require("./utils.js");

async function run() {
  const libs = await loadLibraries();
  const docx = libs.docx;
  
  const params = {
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
    const doc = await buildVnAdminDocx(docx, params, libs, console.log);
    const buffer = await docx.Packer.toBuffer(doc);
    fs.writeFileSync("/tmp/test_output.docx", buffer);
    console.log("Generated successfully. Size:", buffer.length);
  } catch (err) {
    console.error("Error generating docx:", err);
  }
}

run();
