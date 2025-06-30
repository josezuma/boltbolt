import { Link } from 'react-router-dom';
import { Instagram, Twitter, Facebook } from 'lucide-react';

export function Footer() {
  return (
    <footer className="footer-editorial">
      <div className="container-editorial">
        <div className="footer-editorial-content">
          {/* Brand */}
          <div className="footer-editorial-section">
            <Link to="/" className="inline-block mb-6">
              <span className="text-editorial-heading text-xl">BOLTSHOP</span>
            </Link>
            <p className="text-background/70 text-sm leading-relaxed max-w-xs">
              Premium fashion and lifestyle products for the modern individual.
            </p>
          </div>

          {/* Shop */}
          <div className="footer-editorial-section">
            <h3 className="footer-editorial-title mb-4">Shop</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/products" className="footer-editorial-link">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/categories" className="footer-editorial-link">
                  Categories
                </Link>
              </li>
              <li>
                <Link to="/new" className="footer-editorial-link">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link to="/sale" className="footer-editorial-link">
                  Sale
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="footer-editorial-section">
            <h3 className="footer-editorial-title mb-4">Support</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/contact" className="footer-editorial-link">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="footer-editorial-link">
                  Shipping
                </Link>
              </li>
              <li>
                <Link to="/returns" className="footer-editorial-link">
                  Returns
                </Link>
              </li>
              <li>
                <Link to="/size-guide" className="footer-editorial-link">
                  Size Guide
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="footer-editorial-section">
            <h3 className="footer-editorial-title mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="footer-editorial-link">
                  About
                </Link>
              </li>
              <li>
                <Link to="/careers" className="footer-editorial-link">
                  Careers
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="footer-editorial-link">
                  Privacy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="footer-editorial-link">
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-background/20 mt-16 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-background/70 text-sm">
              © 2025 BOLTSHOP. All rights reserved.
            </p>
            
            <div className="flex items-center space-x-6">
              <a href="#" className="text-background/70 hover:text-background transition-colors duration-300">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-background/70 hover:text-background transition-colors duration-300">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-background/70 hover:text-background transition-colors duration-300">
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}