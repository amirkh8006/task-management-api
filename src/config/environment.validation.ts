import Joi from 'joi';

const jwtDurationPattern = /^\d+[smhd]$/;

export const environmentValidationSchema = Joi.object({
  PORT: Joi.number().port().default(3000),
  MONGODB_URI: Joi.string()
    .uri({ scheme: ['mongodb', 'mongodb+srv'] })
    .required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().pattern(jwtDurationPattern).required(),
});
