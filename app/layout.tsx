import "./global.css";

export const metadata = {
  title: "NBA GPT",
  description: "Track NBA players performance, stats and news",
};

const RootLayout = ({ children }) => {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
};

export default RootLayout;
