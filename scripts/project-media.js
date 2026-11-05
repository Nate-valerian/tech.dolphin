const escape = value => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function previewImage(preview, classes = '') {
  return '<img class="' + escape((classes + ' localized-project-preview').trim()) + '" src="' + escape(preview.src) + '" alt="' + escape(preview.alt) + '" loading="lazy" decoding="async">';
}

function localizeProjectMedia(html, site) {
  if (!site.projectMedia) return html;
  const {images = {}, videoPreviews = {}} = site.projectMedia;
  // Recorded interface text cannot be translated by the page's language script.
  // Use the approved English preview instead of a Russian screen recording.
  html = html.replace(/<video\b([^>]*)>([\s\S]*?)<\/video>/g, (video, attributes, content) => {
    const sources = [...content.matchAll(/<source\b[^>]*(?:data-src|src)="([^"]+)"/g)].map(match => match[1]);
    const preview = sources.map(source => videoPreviews[source]).find(Boolean);
    return preview ? previewImage(preview, attributes.match(/\bclass="([^"]*)"/)?.[1]) : video;
  });
  // Also localize posters and image fallbacks, including those on the homepage.
  for (const [source, preview] of Object.entries(images)) html = html.replaceAll(source, preview.src);
  const previews = new Map(Object.values(images).map(preview => [preview.src, preview]));
  return html.replace(/<img\b[^>]*>/g, tag => {
    const preview = previews.get(tag.match(/\bsrc="([^"]+)"/)?.[1]);
    return preview ? previewImage(preview, tag.match(/\bclass="([^"]*)"/)?.[1]?.replace(/\s*localized-project-preview\b/g, '')) : tag;
  });
}

module.exports = {localizeProjectMedia};
