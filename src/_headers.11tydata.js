export default { permalink: () => ((process.env.PLATFORM || 'gh').toLowerCase() === 'cf' ? '/_headers' : false) };
