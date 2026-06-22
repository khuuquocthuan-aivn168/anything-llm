/**
 * Execute a web scraping flow step
 * @param {Object} config Flow step configuration
 * @param {Object} context Execution context with introspect function
 * @returns {Promise<string>} Scraped content
 */
async function executeWebScraping(config, context) {
  const { CollectorApi } = require("../../collectorApi");
  const { TokenManager } = require("../../helpers/tiktoken");
  const Provider = require("../../agents/aibitat/providers/ai-provider");
  const { summarizeContent } = require("../../agents/aibitat/utils/summarize");

  const { url, captureAs = "text", enableSummarization = true } = config;
  const { introspect, logger, aibitat } = context;
  logger(
    `\x1b[43m[AgentFlowToolExecutor]\x1b[0m - executing Web Scraping block`
  );

  if (!url) {
    throw new Error("URL is required for web scraping");
  }

  const captureMode = captureAs === "querySelector" ? "html" : captureAs;
  introspect(`Đang thu thập nội dung của ${url} dưới dạng ${captureAs}...`);
  const { success, content } = await new CollectorApi()
    .getLinkContent(url, captureMode)
    .then((res) => {
      if (captureAs !== "querySelector") return res;
      return parseHTMLwithSelector(res.content, config.querySelector, context);
    });

  if (!success) {
    introspect(`Không thể thu thập nội dung từ ${url}. Không thể sử dụng nội dung trang này.`);
    throw new Error("URL could not be scraped and no content was found.");
  }

  introspect(`Đã thu thập nội dung thành công từ ${url}`);
  if (!content || content?.length === 0) {
    introspect("Không có nội dung nào được thu thập hoặc đọc được.");
    throw new Error("There was no content to be collected or read.");
  }

  if (!enableSummarization) {
    logger(`Returning raw content as summarization is disabled`);
    return content;
  }

  const tokenCount = new TokenManager(
    aibitat.defaultProvider.model
  ).countFromString(content);
  const contextLimit = Provider.contextLimit(
    aibitat.defaultProvider.provider,
    aibitat.defaultProvider.model
  );

  if (tokenCount < contextLimit) {
    logger(
      `Content within token limit (${tokenCount}/${contextLimit}). Returning raw content.`
    );
    return content;
  }

  introspect(
    `Nội dung của trang này quá dài (${tokenCount} tokens). Tôi sẽ tóm tắt nó ngay bây giờ.`
  );
  const summary = await summarizeContent({
    provider: aibitat.defaultProvider.provider,
    model: aibitat.defaultProvider.model,
    content,
    aibitat,
  });

  introspect(`Đã tóm tắt nội dung thành công`);
  return summary;
}

/**
 * Parse HTML with a CSS selector
 * @param {string} html - The HTML to parse
 * @param {string|null} selector - The CSS selector to use (as text string)
 * @param {{introspect: Function}} context - The context object
 * @returns {Object} The parsed content
 */
function parseHTMLwithSelector(html, selector = null, context) {
  if (!selector || selector.length === 0) {
    context.introspect("Không có CSS selector nào được cung cấp. Đang trả về toàn bộ HTML.");
    return { success: true, content: html };
  }

  const Cheerio = require("cheerio");
  const $ = Cheerio.load(html);
  const selectedElements = $(selector);

  let content;
  if (selectedElements.length === 0) {
    return { success: false, content: null };
  } else if (selectedElements.length === 1) {
    content = selectedElements.html();
  } else {
    context.introspect(
      `Đang trích xuất các thành phần khớp với selector: ${selector}`
    );
    content = selectedElements
      .map((_, element) => $(element).html())
      .get()
      .join("\n");
  }
  return { success: true, content };
}

module.exports = executeWebScraping;
