class Setup {
  private static instance: Setup | null = null;

  private constructor() {}

  public static getInstance(): Setup {
    if (Setup.instance === null) {
      Setup.instance = new Setup();
    }
    return Setup.instance;
  }
}

export const setup = Setup.getInstance();
