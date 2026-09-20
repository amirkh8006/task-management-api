import { AppService } from './app.service';

describe('AppService', () => {
  it('returns the application health state', () => {
    const service = new AppService();

    expect(service.getHealth()).toEqual({
      status: 'ok',
      service: 'task-management-api',
      timestamp: expect.any(String) as string,
    });
  });
});
