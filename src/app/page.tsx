export default function Home() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Miniature Life Story Studio</h1>
      <nav style={{ display: "flex", gap: 12 }}>
        <a href="/studio">Studio</a>
        <a href="/stories">Stories</a>
        <a href="/characters">Characters</a>
        <a href="/models">Models</a>
        <a href="/import">Import</a>
        <a href="/login">Login</a>
      </nav>
    </main>
  );
}
