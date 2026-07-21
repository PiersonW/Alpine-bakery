import "./globals.css";
import { CartProvider } from "../components/CartContext";
import UnderConstructionModal from "../components/UnderConstructionModal";

export const metadata = {
  title: "Alpine Bakery",
  description: "Home-baked bread and pastries, made in small batches.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,500;9..144,600;9..144,700&family=Work+Sans:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <CartProvider>
          <UnderConstructionModal />
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
