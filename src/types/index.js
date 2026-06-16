// src/types/index.js
// JSDoc 타입 정의 (타입 힌트용)

/**
 * @typedef {Object} NewsItem
 * @property {string} title
 * @property {string} summary
 * @property {string} url
 * @property {string} source
 * @property {string[]} tags
 * @property {'high'|'medium'|'low'} importance
 */

/**
 * @typedef {Object} NewsletterResult
 * @property {string} date
 * @property {string} headline
 * @property {NewsItem[]} items
 * @property {string} digest
 */

export {}
