import { environmentValidationSchema } from './environment.validation';

const validEnvironment = {
  PORT: 3000,
  MONGODB_URI: 'mongodb://localhost:27017/task-management',
  JWT_SECRET: 'a-development-secret-with-32-characters',
  JWT_EXPIRES_IN: '1d',
};

describe('environmentValidationSchema', () => {
  it('accepts a complete valid environment', () => {
    const { error } = environmentValidationSchema.validate(validEnvironment, {
      allowUnknown: true,
    });

    expect(error).toBeUndefined();
  });

  it.each(['MONGODB_URI', 'JWT_SECRET', 'JWT_EXPIRES_IN'])(
    'rejects a missing %s value',
    (key) => {
      const environment = { ...validEnvironment };
      delete environment[key as keyof typeof environment];

      const { error } = environmentValidationSchema.validate(environment, {
        allowUnknown: true,
      });

      expect(error).toBeDefined();
    },
  );

  it('rejects weak secrets and invalid token durations', () => {
    const { error } = environmentValidationSchema.validate(
      {
        ...validEnvironment,
        JWT_SECRET: 'too-short',
        JWT_EXPIRES_IN: 'tomorrow',
      },
      { abortEarly: false, allowUnknown: true },
    );

    expect(error?.message).toContain('JWT_SECRET');
    expect(error?.message).toContain('JWT_EXPIRES_IN');
  });

  it('rejects invalid ports and non-MongoDB connection strings', () => {
    const { error } = environmentValidationSchema.validate(
      {
        ...validEnvironment,
        PORT: 70_000,
        MONGODB_URI: 'https://example.com/database',
      },
      { abortEarly: false, allowUnknown: true },
    );

    expect(error?.message).toContain('PORT');
    expect(error?.message).toContain('MONGODB_URI');
  });
});
