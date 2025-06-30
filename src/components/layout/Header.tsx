import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, Menu, X, Search, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCartStore, useAuthStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  
  const { getTotalItems } = useCartStore();
  const { user, setUser, isAdmin, isLoading } = useAuthStore();
  const totalItems = getTotalItems();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      navigate('/');
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Error signing out');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="nav-editorial">
      <div className="container-editorial">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-editorial-heading text-2xl">BOLTSHOP</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-12">
            <Link to="/" className="nav-editorial-link">
              Home
            </Link>
            <Link to="/products" className="nav-editorial-link">
              Products
            </Link>
            <Link to="/categories" className="nav-editorial-link">
              Categories
            </Link>
          </nav>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden lg:flex items-center flex-1 max-w-sm mx-8">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="search"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 bg-muted border-0 rounded-none h-12 text-sm tracking-wide"
              />
            </div>
          </form>

          {/* Right Side Actions with Wishlist */}
          <div className="flex items-center space-x-4 sm:space-x-6">
            {/* Wishlist */}
            {user && (
              <Link to="/wishlist" className="relative group">
                <Heart className="w-5 h-5 transition-opacity duration-300 group-hover:opacity-60" />
              </Link>
            )}
            
            {/* Cart */}
            <Link to="/cart" className="relative group">
              <ShoppingBag className="w-5 h-5 transition-opacity duration-300 group-hover:opacity-60" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-foreground text-background text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-0 hover:bg-transparent">
                    <User className="w-5 h-5 hover:opacity-60 transition-opacity duration-300" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-none border-border">
                  <DropdownMenuItem disabled className="text-editorial-caption">
                    {user.email}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/orders" className="text-sm">My Orders</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/wishlist" className="text-sm">My Wishlist</Link>
                  </DropdownMenuItem>
                  {isAdmin() && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin/dashboard" className="text-sm">Admin Dashboard</Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-sm">
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="nav-editorial-link">
                  Sign In
                </Link>
                <Link to="/register" className="nav-editorial-link">
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden p-0 hover:bg-transparent"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? 
                <X className="w-5 h-5 hover:opacity-60 transition-opacity duration-300" /> : 
                <Menu className="w-5 h-5 hover:opacity-60 transition-opacity duration-300" />
              }
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-border bg-background">
            <div className="py-6 space-y-6">
              {/* Mobile Search */}
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    type="search"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 bg-muted border-0 rounded-none h-12 text-sm tracking-wide"
                  />
                </div>
              </form>
              
              {/* Mobile Navigation */}
              <nav className="space-y-4">
                <Link
                  to="/"
                  className="block nav-editorial-link py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  to="/products"
                  className="block nav-editorial-link py-2"
                  onClick={() => setIsMenuOpen(false)}
                  >
                  Products
                </Link>
                <Link to="/products?category=clothing" className="nav-editorial-link"></Link>
                <Link
                  to="/categories"
                  className="block nav-editorial-link py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Categories
                </Link>
              </nav>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}