import * as Joi from 'joi';

/**
 * Environment variables validation schema
 * Ensures all required variables are present at app startup
 */
export const validationSchema = Joi.object({
  // Server
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),

  // Database
  DATABASE_URL: Joi.string().required().messages({
    'any.required': 'DATABASE_URL is required',
    'string.empty': 'DATABASE_URL cannot be empty',
  }),
  DATABASE_URL_POOL: Joi.string().optional(),

  // JWT
  JWT_SECRET: Joi.string().required().min(32).messages({
    'any.required': 'JWT_SECRET is required',
    'string.min': 'JWT_SECRET must be at least 32 characters',
  }),
  JWT_REFRESH_SECRET: Joi.string().min(32).optional(),

  // Frontend URL (for CORS and redirects)
  FRONTEND_URL: Joi.string().required().uri().messages({
    'any.required': 'FRONTEND_URL is required',
    'string.uri': 'FRONTEND_URL must be a valid URI',
  }),

  // Email Service
  MAIL_HOST: Joi.string().required().messages({
    'any.required': 'MAIL_HOST is required',
  }),
  MAIL_PORT: Joi.number().required().messages({
    'any.required': 'MAIL_PORT is required',
  }),
  MAIL_USER: Joi.string().required().messages({
    'any.required': 'MAIL_USER is required',
  }),
  MAIL_PASSWORD: Joi.string().required().messages({
    'any.required': 'MAIL_PASSWORD is required',
  }),
  MAIL_FROM: Joi.string().required().email().messages({
    'any.required': 'MAIL_FROM is required',
    'string.email': 'MAIL_FROM must be a valid email',
  }),

  // Cloudinary (File Storage)
  CLOUDINARY_NAME: Joi.string().required().messages({
    'any.required': 'CLOUDINARY_NAME is required',
  }),
  CLOUDINARY_KEY: Joi.string().required().messages({
    'any.required': 'CLOUDINARY_KEY is required',
  }),
  CLOUDINARY_SECRET: Joi.string().required().messages({
    'any.required': 'CLOUDINARY_SECRET is required',
  }),

  // Payment Gateways
  STRIPE_SECRET_KEY: Joi.string().required().messages({
    'any.required': 'STRIPE_SECRET_KEY is required',
  }),
  STRIPE_PUBLISHABLE_KEY: Joi.string().required().messages({
    'any.required': 'STRIPE_PUBLISHABLE_KEY is required',
  }),
  STRIPE_WEBHOOK_SECRET: Joi.string().optional(),

  // Optional but recommended
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug', 'verbose')
    .default('info'),

  // Default values
  DEFAULT_TAX_RATE: Joi.number().min(0).max(1).default(0),

  // Cache
  CACHE_ENABLED: Joi.string().valid('true', 'false').default('false'),
  CACHE_DEFAULT_TTL: Joi.number().min(30).max(86400).default(300),
  UPSTASH_REDIS_REST_URL: Joi.when('CACHE_ENABLED', {
    is: 'true',
    then: Joi.string().required(),
    otherwise: Joi.string().optional(),
  }),
  UPSTASH_REDIS_REST_TOKEN: Joi.when('CACHE_ENABLED', {
    is: 'true',
    then: Joi.string().required(),
    otherwise: Joi.string().optional(),
  }),

  // Job Queue (QStash)
  JOB_QUEUE_ENABLED: Joi.string().valid('true', 'false').default('false'),
  API_BASE_URL: Joi.when('JOB_QUEUE_ENABLED', {
    is: 'true',
    then: Joi.string().required().uri(),
    otherwise: Joi.string().optional(),
  }),
  QSTASH_TOKEN: Joi.when('JOB_QUEUE_ENABLED', {
    is: 'true',
    then: Joi.string().required(),
    otherwise: Joi.string().optional(),
  }),
  QSTASH_CURRENT_SIGNING_KEY: Joi.when('JOB_QUEUE_ENABLED', {
    is: 'true',
    then: Joi.string().required(),
    otherwise: Joi.string().optional(),
  }),
  QSTASH_NEXT_SIGNING_KEY: Joi.when('JOB_QUEUE_ENABLED', {
    is: 'true',
    then: Joi.string().required(),
    otherwise: Joi.string().optional(),
  }),

  // Content URL signing
  CONTENT_URL_TTL_SECONDS: Joi.number().min(60).max(3600).default(300),

  // Query logging and optimization
  QUERY_LOGGING_ENABLED: Joi.string().valid('true', 'false').default('false'),
  QUERY_LOGGING_THRESHOLD_MS: Joi.number().min(10).max(5000).default(100),
});
