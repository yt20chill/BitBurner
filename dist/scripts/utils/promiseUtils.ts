export const promisify = <
  T extends (...args: any[]) => Exclude<any, Promise<any>>
>(
  callback: T,
  ...args: Parameters<T>
): Promise<ReturnType<T>> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(callback(...args));
      } catch (error) {
        reject(error);
      }
    }, 0);
  });
};
