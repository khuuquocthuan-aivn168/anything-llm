import createDOMPurify from "dompurify";

const DOMPurify = createDOMPurify(window);
DOMPurify.setConfig({
  ADD_TAGS: ["audio", "video", "source"],
  ADD_ATTR: ["target", "rel", "controls", "src", "type", "autoplay", "muted"],
});

export default DOMPurify;
