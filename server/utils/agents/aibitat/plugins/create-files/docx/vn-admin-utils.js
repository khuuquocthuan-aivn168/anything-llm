/**
 * Utilities for generating Vietnamese Administrative Documents (Văn bản hành chính)
 * following Decree 30/2020/NĐ-CP (Nghị định 30/2020/NĐ-CP về công tác văn thư).
 *
 * Reference: Phụ lục I - Thể thức và kỹ thuật trình bày văn bản hành chính
 */

const { loadLibraries, htmlToDocxElements, fetchImage } = require("./utils.js");

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
    canCu: 26,           // 13pt – Căn cứ pháp lý
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

/**
 * Extracts legal basis ("Căn cứ...") lines from the beginning of draft content.
 * Returns the cleaned content and an array of extracted bases.
 */
function extractLegalBasisFromContent(content) {
  if (!content) return { cleanContent: "", extractedBases: [] };
  
  const lines = content.split(/\r?\n/);
  const extractedBases = [];
  const bodyLines = [];
  let reachedBody = false;

  for (let line of lines) {
    const trimmed = line.trim();
    if (reachedBody) {
      bodyLines.push(line);
      continue;
    }

    if (trimmed === "") {
      // Skip empty lines at the very beginning or between bases,
      // but do not mark as reached body yet
      continue;
    }

    // Match list markers or numbering followed by "Căn cứ" (case-insensitive)
    const match = trimmed.match(/^([-*•\d\.\s]*)\s*(Căn\s+cứ\s+.*)$/i);
    if (match) {
      const basisText = match[2].trim();
      extractedBases.push(basisText);
    } else {
      // Reached the first non-empty line that doesn't start with "Căn cứ"
      reachedBody = true;
      bodyLines.push(line);
    }
  }

  return {
    cleanContent: bodyLines.join("\n").trim(),
    extractedBases,
  };
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
    top: { style: docx.BorderStyle.NONE, size: 0, color: "auto" },
    bottom: { style: docx.BorderStyle.NONE, size: 0, color: "auto" },
    left: { style: docx.BorderStyle.NONE, size: 0, color: "auto" },
    right: { style: docx.BorderStyle.NONE, size: 0, color: "auto" },
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
          underline: { type: "single" },
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
    top: { style: docx.BorderStyle.NONE, size: 0, color: "auto" },
    bottom: { style: docx.BorderStyle.NONE, size: 0, color: "auto" },
    left: { style: docx.BorderStyle.NONE, size: 0, color: "auto" },
    right: { style: docx.BorderStyle.NONE, size: 0, color: "auto" },
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
 * Converts HTML content to an array of docx elements tailored to Vietnamese administrative standards
 * (Decree 30/2020/NĐ-CP). All text is Times New Roman, black, and size-hierarchy compliant.
 */
async function htmlToVnAdminDocxElements(html, libs, log) {
  const { JSDOM, docx } = libs;
  const { Paragraph, TextRun, AlignmentType, ImageRun } = docx;
  const S = VN_ADMIN_STYLES;

  const dom = new JSDOM(html);
  const body = dom.window.document.body;
  const elements = [];

  // Helper for processing inline text elements
  async function processVnInline(element, styles = {}) {
    const { TextRun, ExternalHyperlink, ImageRun } = docx;
    const children = [];

    for (const node of element.childNodes) {
      if (node.nodeType === 3) {
        const text = node.textContent;
        if (text && text.trim()) {
          children.push(
            new TextRun({
              text,
              bold: styles.bold || false,
              italics: styles.italics || false,
              strike: styles.strike || false,
              font: S.font,
              size: styles.size || S.sizes.body,
              color: "000000",
            })
          );
        } else if (text && text.includes(" ")) {
          children.push(new TextRun({ text: " ", font: S.font }));
        }
      } else if (node.nodeType === 1) {
        const tagName = node.tagName.toLowerCase();
        switch (tagName) {
          case "strong":
          case "b":
            children.push(...(await processVnInline(node, { ...styles, bold: true })));
            break;
          case "em":
          case "i":
            children.push(...(await processVnInline(node, { ...styles, italics: true })));
            break;
          case "del":
          case "s":
            children.push(...(await processVnInline(node, { ...styles, strike: true })));
            break;
          case "code":
            children.push(
              new TextRun({
                text: node.textContent,
                font: "Consolas",
                size: 22,
                color: "000000",
                shading: { fill: "F2F2F2" },
              })
            );
            break;
          case "a": {
            const href = node.getAttribute("href");
            const isValidHref = href && /^https?:\/\//i.test(href);
            if (isValidHref) {
              children.push(
                new docx.ExternalHyperlink({
                  children: [
                    new TextRun({
                      text: node.textContent,
                      color: "0000EE",
                      underline: { type: "single" },
                      font: S.font,
                      size: styles.size || S.sizes.body,
                    }),
                  ],
                  link: href,
                })
              );
            } else {
              children.push(
                new TextRun({
                  text: node.textContent,
                  font: S.font,
                  size: styles.size || S.sizes.body,
                  color: "000000",
                })
              );
            }
            break;
          }
          case "br":
            children.push(new TextRun({ break: 1 }));
            break;
          default:
            children.push(...(await processVnInline(node, styles)));
        }
      }
    }
    return children;
  }

  // Helper for lists
  async function processVnList(listElement, isOrdered, level = 0) {
    const listParagraphs = [];
    const items = listElement.querySelectorAll(":scope > li");

    for (const li of items) {
      const inlineChildren = [];
      const nestedLists = [];

      for (const child of li.childNodes) {
        if (child.nodeType === 1) {
          const tagName = child.tagName.toLowerCase();
          if (tagName === "ul" || tagName === "ol") {
            nestedLists.push({ element: child, ordered: tagName === "ol" });
          } else {
            const wrapper = li.ownerDocument.createElement("span");
            wrapper.appendChild(child.cloneNode(true));
            inlineChildren.push(...(await processVnInline(wrapper, {})));
          }
        } else if (child.nodeType === 3 && child.textContent.trim()) {
          const wrapper = li.ownerDocument.createElement("span");
          wrapper.textContent = child.textContent;
          inlineChildren.push(...(await processVnInline(wrapper, {})));
        }
      }

      if (inlineChildren.length > 0) {
        listParagraphs.push(
          new Paragraph({
            children: inlineChildren,
            bullet: isOrdered ? undefined : { level },
            numbering: isOrdered
              ? { reference: "default-numbering", level }
              : undefined,
            spacing: { after: 60, line: S.spacing.lineSpacing },
          })
        );
      }

      for (const nested of nestedLists) {
        listParagraphs.push(
          ...(await processVnList(nested.element, nested.ordered, level + 1))
        );
      }
    }
    return listParagraphs;
  }

  // Helper for tables conforming to VN administrative format
  async function processVnTable(tableElement) {
    const { Table, TableRow, TableCell, WidthType, BorderStyle, TableLayoutType } = docx;
    const rows = [];
    const tableRows = tableElement.querySelectorAll("tr");

    const firstRow = tableRows[0];
    const columnCount = firstRow ? firstRow.querySelectorAll("th, td").length : 1;
    const columnWidthPercent = Math.floor(100 / columnCount);

    let dataRowIndex = 0;
    for (const tr of tableRows) {
      const cells = [];
      const cellElements = tr.querySelectorAll("th, td");
      const isHeader = tr.querySelector("th") !== null;

      // Table header gets bold text and clean light grey shading
      let shadingFill;
      if (isHeader) {
        shadingFill = "EAEAEA"; // light grey for headers
      } else if (dataRowIndex % 2 === 1) {
        shadingFill = "F9F9F9"; // zebra striping
      }

      for (const cell of cellElements) {
        // Table cell content should be slightly smaller (13pt / size 26) to look clean
        const cellChildren = await processVnInline(cell, {
          size: 26, 
          bold: isHeader
        });
        
        cells.push(
          new TableCell({
            children: [
              new Paragraph({
                children: cellChildren.length > 0 ? cellChildren : [new TextRun({ text: "", font: S.font, size: 26 })],
                alignment: isHeader ? AlignmentType.CENTER : AlignmentType.LEFT,
                spacing: { before: 80, after: 80 },
              }),
            ],
            width: { size: columnWidthPercent, type: WidthType.PERCENTAGE },
            shading: shadingFill ? { fill: shadingFill } : undefined,
            margins: { top: 100, bottom: 100, left: 150, right: 150 },
          })
        );
      }

      if (cells.length > 0) {
        rows.push(new TableRow({ children: cells }));
      }

      if (!isHeader) {
        dataRowIndex++;
      }
    }

    return new Table({
      rows,
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: "555555" },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: "555555" },
        left: { style: BorderStyle.SINGLE, size: 2, color: "888888" },
        right: { style: BorderStyle.SINGLE, size: 2, color: "888888" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
        insideVertical: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
      },
    });
  }

  // Iterate top-level DOM nodes in body
  for (const child of body.children) {
    const tagName = child.tagName.toLowerCase();

    try {
      if (tagName === "h1") {
        // H1: Phần, Chương
        // Style: Centered, Bold, uppercase
        const rawText = child.textContent.trim();
        const upperText = rawText.toUpperCase();
        
        elements.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: upperText,
                bold: true,
                font: S.font,
                size: 28, // 14pt
                color: "000000",
              }),
            ],
            spacing: { before: 240, after: 120 },
          })
        );
      } else if (tagName === "h2") {
        // H2: Mục, Điều
        // Style: Bold, Sentence case, left-aligned, indent first line
        const inlineChildren = await processVnInline(child, { bold: true, size: 28 });
        elements.push(
          new Paragraph({
            alignment: AlignmentType.LEFT,
            indent: { firstLine: 720 }, // ~1.27cm
            children: inlineChildren.length > 0 ? inlineChildren : [
              new TextRun({
                text: child.textContent,
                bold: true,
                font: S.font,
                size: 28,
                color: "000000",
              })
            ],
            spacing: { before: 180, after: 120 },
          })
        );
      } else if (tagName === "h3") {
        // H3: Tiểu mục, Khoản
        // Style: Bold, left-aligned, indent first line
        const inlineChildren = await processVnInline(child, { bold: true, size: 28 });
        elements.push(
          new Paragraph({
            alignment: AlignmentType.LEFT,
            indent: { firstLine: 720 },
            children: inlineChildren.length > 0 ? inlineChildren : [
              new TextRun({
                text: child.textContent,
                bold: true,
                font: S.font,
                size: 28,
                color: "000000",
              })
            ],
            spacing: { before: 120, after: 60 },
          })
        );
      } else if (tagName === "h4" || tagName === "h5" || tagName === "h6") {
        // H4/H5/H6: Điểm
        // Style: Italics, left-aligned, indent first line
        const inlineChildren = await processVnInline(child, { italics: true, size: 28 });
        elements.push(
          new Paragraph({
            alignment: AlignmentType.LEFT,
            indent: { firstLine: 720 },
            children: inlineChildren.length > 0 ? inlineChildren : [
              new TextRun({
                text: child.textContent,
                italics: true,
                font: S.font,
                size: 28,
                color: "000000",
              })
            ],
            spacing: { before: 120, after: 60 },
          })
        );
      } else if (tagName === "p") {
        const inlineChildren = await processVnInline(child, { size: 28 });
        if (inlineChildren.length > 0) {
          elements.push(
            new Paragraph({
              children: inlineChildren,
              alignment: AlignmentType.JUSTIFIED,
              indent: { firstLine: 720 }, // 1.27cm indent
              spacing: { after: 120, line: S.spacing.lineSpacing },
            })
          );
        }
      } else if (tagName === "ul") {
        elements.push(...(await processVnList(child, false, 0)));
      } else if (tagName === "ol") {
        elements.push(...(await processVnList(child, true, 0)));
      } else if (tagName === "table") {
        elements.push(await processVnTable(child));
        elements.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
      } else if (tagName === "blockquote") {
        const inlineChildren = await processVnInline(child, { italics: true, size: 26 });
        elements.push(
          new Paragraph({
            children: inlineChildren,
            indent: { left: 720 },
            border: {
              left: { style: "single", size: 18, color: "888888" },
            },
            spacing: { before: 120, after: 120 },
          })
        );
      } else if (tagName === "hr") {
        elements.push(
          new Paragraph({
            children: [],
            border: {
              bottom: { style: "single", size: 6, color: "CCCCCC" },
            },
            spacing: { before: 120, after: 120 },
          })
        );
      } else if (tagName === "img") {
        const src = child.getAttribute("src");
        if (src) {
          const imageData = await fetchImage(src, log);
          if (imageData) {
            elements.push(
              new Paragraph({
                children: [
                  new ImageRun({
                    data: imageData.buffer,
                    transformation: {
                      width: imageData.width,
                      height: imageData.height,
                    },
                    type: imageData.type,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { before: 200, after: 200 },
              })
            );
          }
        }
      } else {
        const inlineChildren = await processVnInline(child, {});
        if (inlineChildren.length > 0) {
          elements.push(
            new Paragraph({
              children: inlineChildren,
              spacing: { after: 120 },
            })
          );
        }
      }
    } catch (err) {
      log(`htmlToVnAdminDocxElements error processing tag ${tagName}: ${err.message}`);
    }
  }

  return elements;
}

/**
 * Converts markdown content to DOCX paragraphs using the standard
 * body text style (Times New Roman, 14pt).
 */
async function buildBodyContent(docx, libs, content, log) {
  const { marked } = libs;
  marked.setOptions({ gfm: true, breaks: true });
  const html = marked.parse(content);
  const elements = await htmlToVnAdminDocxElements(html, libs, log);

  if (elements.length === 0) {
    const { Paragraph, TextRun, AlignmentType } = docx;
    elements.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        indent: { firstLine: 720 },
        children: [
          new TextRun({
            text: content,
            font: VN_ADMIN_STYLES.font,
            size: VN_ADMIN_STYLES.sizes.body,
            color: "000000",
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
    top: { style: docx.BorderStyle.NONE, size: 0, color: "auto" },
    bottom: { style: docx.BorderStyle.NONE, size: 0, color: "auto" },
    left: { style: docx.BorderStyle.NONE, size: 0, color: "auto" },
    right: { style: docx.BorderStyle.NONE, size: 0, color: "auto" },
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
    title: (params.title || "Văn bản hành chính").replace(/\n/g, " "),
    creator: "AnythingLLM",
    description: `Văn bản hành chính - ${documentTypeInfo.name}`.replace(/\n/g, " "),
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
          titlePage: true,
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
          first: new Header({ children: [new Paragraph({ children: [] })] }), // No page number on first page
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
  extractLegalBasisFromContent,
  buildHeaderSection,
  buildNumberDateSection,
  buildTitleSection,
  buildLegalBasisParagraphs,
  buildBodyContent,
  buildSignatureBlock,
  buildRecipientsBlock,
  buildVnAdminDocx,
};
