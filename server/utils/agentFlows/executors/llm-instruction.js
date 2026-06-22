/**
 * Execute an LLM instruction flow step
 * @param {Object} config Flow step configuration
 * @param {{introspect: Function, logger: Function}} context Execution context with introspect function
 * @returns {Promise<string>} Processed result
 */
async function executeLLMInstruction(config, context) {
  const { instruction, resultVariable } = config;
  const { introspect, logger, aibitat } = context;
  logger(
    `\x1b[43m[AgentFlowToolExecutor]\x1b[0m - executing LLM Instruction block`
  );
  introspect(`Đang xử lý dữ liệu với chỉ thị LLM...`);

  try {
    logger(
      `Sending request to LLM (${aibitat.defaultProvider.provider}::${aibitat.defaultProvider.model})`
    );
    introspect(`Đang gửi yêu cầu tới LLM...`);

    // Ensure the input is a string since we are sending it to the LLM direct as a message
    let input = instruction;
    if (typeof input === "object") input = JSON.stringify(input);
    if (typeof input !== "string") input = String(input);

    let completion;
    const provider = aibitat.getProviderForConfig(aibitat.defaultProvider);
    if (provider.supportsAgentStreaming) {
      completion = await provider.stream(
        [{ role: "user", content: input }],
        [],
        null
      );
    } else {
      completion = await provider.complete([{ role: "user", content: input }]);
    }

    introspect(`Đã nhận được phản hồi từ LLM thành công`);
    if (resultVariable) config.resultVariable = resultVariable;
    return completion.textResponse;
  } catch (error) {
    logger(`LLM processing failed: ${error.message}`, error);
    throw new Error(`LLM processing failed: ${error.message}`);
  }
}

module.exports = executeLLMInstruction;
