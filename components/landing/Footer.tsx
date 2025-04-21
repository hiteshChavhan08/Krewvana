import React from "react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-6 border-t">
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
        <p>© {currentYear} Kanaka. All Rights Reserved.</p>
        {/* Add links here if needed */}
        {/* <nav className="mt-2">
          <a href="#" className="hover:underline mx-2">Helpdesk</a>
          <a href="#" className="hover:underline mx-2">IT Support</a>
        </nav> */}
      </div>
    </footer>
  );
}