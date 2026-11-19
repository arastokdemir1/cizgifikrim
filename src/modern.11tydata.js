export default {eleventyComputed:{noindex:data=>Boolean(data.entry?.noindex),sitemap:data=>!data.entry?.noindex}};
