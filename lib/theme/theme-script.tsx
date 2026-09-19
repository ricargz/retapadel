export function ThemeScript() {
  const code = `
    (function() {
      try {
        var media = window.matchMedia('(prefers-color-scheme: dark)');
        var isDark = media.matches;
        document.documentElement.classList.toggle('dark', isDark);
        document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
      } catch (error) {}
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
