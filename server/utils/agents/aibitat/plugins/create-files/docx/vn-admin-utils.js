/**
 * Utilities for generating Vietnamese Administrative Documents (Văn bản hành chính)
 * following Decree 30/2020/NĐ-CP (Nghị định 30/2020/NĐ-CP về công tác văn thư).
 *
 * Reference: Phụ lục I - Thể thức và kỹ thuật trình bày văn bản hành chính
 */

const { loadLibraries, htmlToDocxElements } = require("./utils.js");

// ---------------------------------------------------------------------------
// 1. Constants & Styles
// ---------------------------------------------------------------------------

/**
 * Vietnamese administrative document styles per Decree 30/2020/NĐ-CP Appendix I.
 * All measurements in twips (1 inch = 1440 twips, 1mm ≈ 56.7 twips).
 * Font sizes are in half-points (size 26 = 13pt).
 */
const VN_ADMIN_STYLES = {
  font: "Times New Roman",
  // A4 margins: top/bottom 20-25mm, left 30-35mm, right 15-20mm
  margins: {
    top: 1134,    // ~20mm
    bottom: 1134, // ~20mm
    left: 1701,   // ~30mm
    right: 1134,  // ~20mm
  },
  sizes: {
    quocHieu: 26,        // 13pt – Quốc hiệu
    tieuNgu: 28,         // 14pt – Tiêu ngữ
    coQuan: 26,          // 13pt – Tên cơ quan
    soKyHieu: 26,        // 13pt – Số, ký hiệu
    diaDanh: 28,         // 14pt – Địa danh, ngày tháng
    tenLoaiVB: 28,       // 14pt – Tên loại văn bản
    trichYeu: 28,        // 14pt – Trích yếu
    body: 28,            // 14pt – Nội dung
    canCu: 28,           // 14pt – Căn cứ pháp lý
    chucVuKy: 28,        // 14pt – Chức vụ người ký
    hoTen: 28,           // 14pt – Họ tên người ký
    noiNhanLabel: 24,    // 12pt – "Nơi nhận:" label
    noiNhanItem: 22,     // 11pt – Nơi nhận items
    pageNumber: 28,      // 14pt – Số trang
  },
  spacing: {
    sectionGap: 120,     // 6pt between major sections
    lineSpacing: 264,    // ~1.15 lines (twips) – within single-spaced range
    paragraphAfter: 120, // 6pt after paragraph
  },
};

/**
 * Vietnamese administrative document types per Decree 30/2020/NĐ-CP.
 * Maps document type key → { name, abbreviation, templateType }
 *   templateType: "named" (có tên loại) or "cong-van" (công văn, không tên loại)
 */
const VN_DOCUMENT_TYPES = {
  "nghi-quyet":        { name: "NGHỊ QUYẾT",        abbr: "NQ",   template: "named" },
  "quyet-dinh":        { name: "QUYẾT ĐỊNH",        abbr: "QĐ",   template: "named" },
  "chi-thi":           { name: "CHỈ THỊ",            abbr: "CT",   template: "named" },
  "quy-che":           { name: "QUY CHẾ",            abbr: "QC",   template: "named" },
  "quy-dinh":          { name: "QUY ĐỊNH",           abbr: "QĐi",  template: "named" },
  "thong-cao":         { name: "THÔNG CÁO",          abbr: "TC",   template: "named" },
  "thong-bao":         { name: "THÔNG BÁO",          abbr: "TB",   template: "named" },
  "huong-dan":         { name: "HƯỚNG DẪN",          abbr: "HD",   template: "named" },
  "chuong-trinh":      { name: "CHƯƠNG TRÌNH",       abbr: "CTr",  template: "named" },
  "ke-hoach":          { name: "KẾ HOẠCH",           abbr: "KH",   template: "named" },
  "phuong-an":         { name: "PHƯƠNG ÁN",          abbr: "PA",   template: "named" },
  "de-an":             { name: "ĐỀ ÁN",              abbr: "ĐA",   template: "named" },
  "du-an":             { name: "DỰ ÁN",              abbr: "DA",   template: "named" },
  "bao-cao":           { name: "BÁO CÁO",            abbr: "BC",   template: "named" },
  "bien-ban":          { name: "BIÊN BẢN",            abbr: "BB",   template: "named" },
  "to-trinh":          { name: "TỜ TRÌNH",            abbr: "TTr",  template: "named" },
  "hop-dong":          { name: "HỢP ĐỒNG",           abbr: "HĐ",   template: "named" },
  "cong-van":          { name: "CÔNG VĂN",            abbr: "",     template: "cong-van" },
  "cong-dien":         { name: "CÔNG ĐIỆN",           abbr: "CĐ",   template: "named" },
  "ban-ghi-nho":       { name: "BẢN GHI NHỚ",        abbr: "BGN",  template: "named" },
  "ban-thoa-thuan":    { name: "BẢN THỎA THUẬN",     abbr: "BTT",  template: "named" },
  "giay-uy-quyen":     { name: "GIẤY ỦY QUYỀN",      abbr: "GUQ",  template: "named" },
  "giay-moi":          { name: "GIẤY MỜI",            abbr: "GM",   template: "named" },
  "giay-gioi-thieu":   { name: "GIẤY GIỚI THIỆU",    abbr: "GGT",  template: "named" },
  "giay-nghi-phep":    { name: "GIẤY NGHỈ PHÉP",     abbr: "GNP",  template: "named" },
  "phieu-gui":         { name: "PHIẾU GỬI",           abbr: "PG",   template: "named" },
  "phieu-chuyen":      { name: "PHIẾU CHUYỂN",        abbr: "PC",   template: "named" },
  "phieu-bao":         { name: "PHIẾU BÁO",           abbr: "PB",   template: "named" },
  "thu-cong":          { name: "THƯ CÔNG",             abbr: "",     template: "named" },
};

/**
 * Returns the list of document type keys for use in JSON schema enums.
 */
function getDocumentTypeKeys() {
  return Object.keys(VN_DOCUMENT_TYPES);
}

/**
 * Looks up document type info by key, with a fallback.
 */
function getDocumentType(key) {
  return VN_DOCUMENT_TYPES[key] || VN_DOCUMENT_TYPES["cong-van"];
}

// ---------------------------------------------------------------------------
// 2. DOCX rendering helpers
// ---------------------------------------------------------------------------

/**
 * Creates the header area of a Vietnamese administrative document.
 * Left column: Tên cơ quan chủ quản + Tên cơ quan ban hành
 * Right column: Quốc hiệu + Tiêu ngữ
 *
 * Layout uses a 2-column table with no visible borders.
 */
function buildHeaderSection(docx, {
  parentAgency = "",
  issuingAgency = "",
}) {
  const {
    Paragraph, TextRun, AlignmentType,
    Table, TableRow, TableCell, WidthType,
    UnderlineType,
  } = docx;
  const S = VN_ADMIN_STYLES;
  const noBorders = {
    top: { style: "none" },
    bottom: { style: "none" },
    left: { style: "none" },
    right: { style: "none" },
  };

  // --- Left column: Cơ quan ---
  const leftChildren = [];
  if (parentAgency) {
    leftChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 0 },
        children: [
          new TextRun({
            text: parentAgency.toUpperCase(),
            font: S.font,
            size: S.sizes.coQuan,
          }),
        ],
      })
    );
  }
  leftChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 0 },
      children: [
        new TextRun({
          text: issuingAgency.toUpperCase(),
          font: S.font,
          size: S.sizes.coQuan,
          bold: true,
        }),
      ],
    })
  );
  // Gạch ngang dưới tên cơ quan ban hành
  leftChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 0 },
      children: [
        new TextRun({
          text: "───────",
          font: S.font,
          size: S.sizes.coQuan,
        }),
      ],
    })
  );

  // --- Right column: Quốc hiệu + Tiêu ngữ ---
  const rightChildren = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 0 },
      children: [
        new TextRun({
          text: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM",
          font: S.font,
          size: S.sizes.quocHieu,
          bold: true,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 0 },
      children: [
        new TextRun({
          text: "Độc lập - Tự do - Hạnh phúc",
          font: S.font,
          size: S.sizes.tieuNgu,
          bold: true,
          underline: { type: UnderlineType.SINGLE },
        }),
      ],
    }),
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      ...noBorders,
      insideHorizontal: { style: "none" },
      insideVertical: { style: "none" },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            borders: noBorders,
            children: leftChildren,
          }),
          new TableCell({
            width: { size: 60, type: WidthType.PERCENTAGE },
            borders: noBorders,
            children: rightChildren,
          }),
        ],
      }),
    ],
  });
}

/**
 * Creates the Số/Ký hiệu (left) and Địa danh, ngày tháng (right) row.
 */
function buildNumberDateSection(docx, {
  documentNumber = "",
  symbol = "",
  location = "",
  date = null,
  documentTypeInfo = null,
}) {
  const {
    Paragraph, TextRun, AlignmentType,
    Table, TableRow, TableCell, WidthType,
  } = docx;
  const S = VN_ADMIN_STYLES;
  const noBorders = {
    top: { style: "none" },
    bottom: { style: "none" },
    left: { style: "none" },
    right: { style: "none" },
  };

  // Build symbol string: Số: XX/YYYY-ABBR
  const abbr = documentTypeInfo?.abbr || "";
  let symbolText = `Số: ${documentNumber || "......"}`;
  if (symbol) {
    symbolText += `/${symbol}`;
    if (abbr) symbolText += `-${abbr}`;
  } else if (abbr) {
    symbolText += `/${abbr}`;
  }

  // Build date string
  const dateObj = date ? new Date(date) : new Date();
  const day = dateObj.getDate();
  const month = dateObj.getMonth() + 1;
  const year = dateObj.getFullYear();
  const dateText = `${location || "......"},  ngày ${String(day).padStart(2, "0")} tháng ${String(month).padStart(2, "0")} năm ${year}`;

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      ...noBorders,
      insideHorizontal: { style: "none" },
      insideVertical: { style: "none" },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            borders: noBorders,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: symbolText,
                    font: S.font,
                    size: S.sizes.soKyHieu,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 60, type: WidthType.PERCENTAGE },
            borders: noBorders,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: dateText,
                    font: S.font,
                    size: S.sizes.diaDanh,
                    italics: true,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

/**
 * Creates the document type name and summary/title section (centered).
 */
function buildTitleSection(docx, { documentTypeInfo, title }) {
  const { Paragraph, TextRun, AlignmentType } = docx;
  const S = VN_ADMIN_STYLES;
  const elements = [];

  // Tên loại văn bản (IN HOA, đậm, giữa)
  if (documentTypeInfo && documentTypeInfo.template === "named") {
    elements.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 240, after: 0 },
        children: [
          new TextRun({
            text: documentTypeInfo.name,
            font: S.font,
            size: S.sizes.tenLoaiVB,
            bold: true,
          }),
        ],
      })
    );
  }

  // Trích yếu
  if (title) {
    elements.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: documentTypeInfo?.template === "named" ? 60 : 240, after: 0 },
        children: [
          new TextRun({
            text: title,
            font: S.font,
            size: S.sizes.trichYeu,
            bold: true,
          }),
        ],
      })
    );
    // Gạch ngang dưới trích yếu
    elements.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: "─────────────",
            font: S.font,
            size: 20,
          }),
        ],
      })
    );
  }

  return elements;
}

/**
 * Creates the legal basis (Căn cứ pháp lý) paragraphs.
 * Each basis is italic, ends with ";", last one ends with ".".
 */
function buildLegalBasisParagraphs(docx, legalBases = []) {
  if (!legalBases || legalBases.length === 0) return [];
  const { Paragraph, TextRun } = docx;
  const S = VN_ADMIN_STYLES;

  return legalBases.map((basis, index) => {
    const isLast = index === legalBases.length - 1;
    const separator = isLast ? "." : ";";
    // Clean any trailing punctuation from basis text
    const cleanBasis = basis.replace(/[;.,]+\s*$/, "");
    return new Paragraph({
      spacing: { after: 60 },
      indent: { firstLine: 720 }, // ~0.5 inch indent
      children: [
        new TextRun({
          text: `${cleanBasis}${separator}`,
          font: S.font,
          size: S.sizes.canCu,
          italics: true,
        }),
      ],
    });
  });
}

/**
 * Converts markdown content to DOCX paragraphs using the standard
 * body text style (Times New Roman, 14pt).
 */
async function buildBodyContent(docx, libs, content, log) {
  const { marked } = libs;
  marked.setOptions({ gfm: true, breaks: true });
  const html = marked.parse(content);
  const elements = await htmlToDocxElements(html, libs, log, null);

  // Override font/size on each element's runs to match VN admin style
  // (htmlToDocxElements uses Calibri by default)
  // We rebuild simple paragraphs with correct font if elements are empty
  if (elements.length === 0) {
    const { Paragraph, TextRun } = docx;
    elements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: content,
            font: VN_ADMIN_STYLES.font,
            size: VN_ADMIN_STYLES.sizes.body,
          }),
        ],
      })
    );
  }

  return elements;
}

/**
 * Creates the signature block (Khối chữ ký).
 * Right-aligned: Title line → [space for signature] → Full name
 */
function buildSignatureBlock(docx, { signerTitle = "", signerName = "" }) {
  const { Paragraph, TextRun, AlignmentType,
    Table, TableRow, TableCell, WidthType } = docx;
  const S = VN_ADMIN_STYLES;
  const noBorders = {
    top: { style: "none" },
    bottom: { style: "none" },
    left: { style: "none" },
    right: { style: "none" },
  };

  const sigChildren = [];

  // Chức vụ người ký (IN HOA, đậm)
  if (signerTitle) {
    sigChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 0 },
        children: [
          new TextRun({
            text: signerTitle.toUpperCase(),
            font: S.font,
            size: S.sizes.chucVuKy,
            bold: true,
          }),
        ],
      })
    );
  }

  // Khoảng trống cho chữ ký (3 dòng trống)
  for (let i = 0; i < 3; i++) {
    sigChildren.push(
      new Paragraph({
        spacing: { after: 0 },
        children: [new TextRun({ text: "", font: S.font, size: S.sizes.body })],
      })
    );
  }

  // Họ tên người ký (đậm)
  if (signerName) {
    sigChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 0 },
        children: [
          new TextRun({
            text: signerName,
            font: S.font,
            size: S.sizes.hoTen,
            bold: true,
          }),
        ],
      })
    );
  }

  // Use a table to right-align the signature block
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      ...noBorders,
      insideHorizontal: { style: "none" },
      insideVertical: { style: "none" },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: noBorders,
            children: [new Paragraph({ children: [] })],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: noBorders,
            children: sigChildren,
          }),
        ],
      }),
    ],
  });
}

/**
 * Creates the "Nơi nhận" (Recipients) block at the bottom-left.
 */
function buildRecipientsBlock(docx, recipients = []) {
  const { Paragraph, TextRun } = docx;
  const S = VN_ADMIN_STYLES;

  const elements = [];

  // "Nơi nhận:" label (đậm, nghiêng)
  elements.push(
    new Paragraph({
      spacing: { before: 240, after: 60 },
      children: [
        new TextRun({
          text: "Nơi nhận:",
          font: S.font,
          size: S.sizes.noiNhanLabel,
          bold: true,
          italics: true,
        }),
      ],
    })
  );

  // Each recipient as a bullet-style list
  const recipientList = recipients.length > 0
    ? recipients
    : ["- Như trên;", "- Lưu: VT."];

  recipientList.forEach((recipient, index) => {
    const isLast = index === recipientList.length - 1;
    let text = recipient.replace(/^[-–•]\s*/, "");
    // Ensure proper trailing punctuation
    if (!text.match(/[;.]$/)) {
      text += isLast ? "." : ";";
    }
    elements.push(
      new Paragraph({
        spacing: { after: 0 },
        children: [
          new TextRun({
            text: `- ${text}`,
            font: S.font,
            size: S.sizes.noiNhanItem,
          }),
        ],
      })
    );
  });

  return elements;
}

/**
 * Main function: Assembles a complete Vietnamese administrative document DOCX.
 *
 * @param {Object} docx - The docx library
 * @param {Object} params - Document parameters
 * @param {Object} libs - Loaded libraries (marked, JSDOM, docx)
 * @param {Function} log - Logging function
 * @returns {Promise<Object>} A docx Document ready for packing
 */
async function buildVnAdminDocx(docx, params, libs, log) {
  const {
    Document, Packer, Paragraph, TextRun,
    AlignmentType, PageNumber, Header, Footer,
  } = docx;
  const S = VN_ADMIN_STYLES;

  const documentTypeInfo = getDocumentType(params.documentType);

  // Assemble all document children in order
  const children = [];

  // 1. Header: Cơ quan + Quốc hiệu
  children.push(
    buildHeaderSection(docx, {
      parentAgency: params.parentAgency,
      issuingAgency: params.issuingAgency,
    })
  );

  // Spacer
  children.push(new Paragraph({ spacing: { after: 60 }, children: [] }));

  // 2. Số/Ký hiệu + Địa danh, ngày tháng
  children.push(
    buildNumberDateSection(docx, {
      documentNumber: params.documentNumber,
      symbol: params.symbol,
      location: params.location,
      date: params.date,
      documentTypeInfo,
    })
  );

  // 3. Tên loại văn bản + Trích yếu
  children.push(
    ...buildTitleSection(docx, {
      documentTypeInfo,
      title: params.title,
    })
  );

  // 4. Căn cứ pháp lý (if any)
  if (params.legalBasis && params.legalBasis.length > 0) {
    children.push(
      ...buildLegalBasisParagraphs(docx, params.legalBasis)
    );
  }

  // 5. Nội dung chính
  if (params.content) {
    const bodyElements = await buildBodyContent(
      docx, libs, params.content, log
    );
    children.push(
      new Paragraph({ spacing: { before: 120 }, children: [] })
    );
    children.push(...bodyElements);
  }

  // 6. Khối chữ ký
  children.push(
    new Paragraph({ spacing: { before: 240 }, children: [] })
  );
  children.push(
    buildSignatureBlock(docx, {
      signerTitle: params.signerTitle,
      signerName: params.signerName,
    })
  );

  // 7. Nơi nhận
  children.push(...buildRecipientsBlock(docx, params.recipients));

  // --- Build the Document ---
  const doc = new Document({
    title: params.title || "Văn bản hành chính",
    creator: "AnythingLLM",
    description: `Văn bản hành chính - ${documentTypeInfo.name}`,
    styles: {
      default: {
        document: {
          run: {
            font: S.font,
            size: S.sizes.body,
          },
          paragraph: {
            spacing: {
              after: S.spacing.paragraphAfter,
              line: S.spacing.lineSpacing,
            },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: S.margins,
            size: {
              width: 11906,  // A4 width in twips (210mm)
              height: 16838, // A4 height in twips (297mm)
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: S.font,
                    size: S.sizes.pageNumber,
                  }),
                ],
              }),
            ],
          }),
          first: new Header({ children: [] }), // No page number on first page
        },
        children,
      },
    ],
  });

  return doc;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  VN_ADMIN_STYLES,
  VN_DOCUMENT_TYPES,
  getDocumentTypeKeys,
  getDocumentType,
  buildHeaderSection,
  buildNumberDateSection,
  buildTitleSection,
  buildLegalBasisParagraphs,
  buildBodyContent,
  buildSignatureBlock,
  buildRecipientsBlock,
  buildVnAdminDocx,
};
