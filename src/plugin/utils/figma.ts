let mock = undefined as any as Partial<PluginAPI>;
const isFigmaPlugin = typeof figma !== 'undefined';
if (!isFigmaPlugin) {
  mock = {
    clientStorage: {
      async getAsync(key: string) {
        try {
          return JSON.parse(localStorage.getItem(`figma_mock__${key}`) || 'null');
        } catch (err) {
          return null;
        }
      },
      async setAsync(key: string, value: any) {
        localStorage.setItem(`figma_mock__${key}`, JSON.stringify(value));
      }
    }
  } as Partial<PluginAPI>;

}

export function getFigma(): PluginAPI {
  if (typeof figma === 'undefined') {
    console.log('NOT defined, mocking3');
    // Mock
    return mock as PluginAPI;
  }
  console.log('defined');
  return figma;
}