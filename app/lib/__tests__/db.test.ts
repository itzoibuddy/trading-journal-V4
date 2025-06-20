import { prisma } from '../db';

describe('Database Connection', () => {
  it('should connect to the database', async () => {
    // Test database connection
    const result = await prisma.$queryRaw`SELECT 1 as result`;
    expect(result).toBeDefined();
  });

  it('should handle connection errors gracefully', async () => {
    // Mock a connection error
    const spy = jest.spyOn(prisma, '$queryRaw').mockRejectedValueOnce(
      new Error('Connection failed')
    );

    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('Connection failed');
    }

    spy.mockRestore();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
}); 