import { create } from 'zustand';

const useThemeStore = create((set) => ({
  theme: localStorage.getItem('cho1-theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('cho1-theme', newTheme);
    return { theme: newTheme };
  }),
  setTheme: (theme) => set(() => {
    localStorage.setItem('cho1-theme', theme);
    return { theme };
  })
}));

export default useThemeStore;
