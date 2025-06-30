# BoltShop - Modern E-commerce Platform

BoltShop is a full-featured e-commerce platform built with React, Vite, Tailwind CSS, and Supabase. It provides a complete solution for online stores with product management, shopping cart, checkout, user authentication, and an admin dashboard.

![BoltShop Screenshot](https://images.pexels.com/photos/5632402/pexels-photo-5632402.jpeg?auto=compress&cs=tinysrgb&w=1200)

## Features

- 🛍️ **Product Catalog** - Browse and search products by category, brand, and more
- 🛒 **Shopping Cart** - Add products to cart, update quantities, and checkout
- 💳 **Secure Checkout** - Integrated with Stripe for secure payments
- 👤 **User Accounts** - Register, login, and manage your profile
- 📦 **Order Management** - Track orders and view order history
- ❤️ **Wishlist** - Save products for later
- ⭐ **Reviews** - Leave reviews and ratings for products
- 🔍 **Search** - Find products quickly with powerful search
- 🏷️ **Discounts** - Apply discount codes at checkout
- 📱 **Responsive Design** - Works on all devices
- 🔒 **Admin Dashboard** - Manage products, orders, customers, and more

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (for database and authentication)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/boltshop.git
   cd boltshop
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Initialize the database:
   - Connect to Supabase using the "Connect to Supabase" button in the top right corner
   - The migrations will automatically create the necessary tables and seed data

5. Start the development server:
   ```bash
   npm run dev
   ```

### Database Setup

BoltShop includes two important files for database setup:

1. **Installation Script** (`installation/install.txt`):
   - This file contains SQL commands to set up the database schema
   - It creates all necessary tables, relationships, and security policies
   - Run this first to establish the database structure

2. **Seed Data** (`installation/seed.txt`):
   - This file populates the database with sample data
   - It includes categories, brands, products, and more
   - Run this after the installation script to have a working store with sample products

To use these files:

1. Go to the Supabase dashboard for your project
2. Navigate to the SQL Editor
3. Create a new query
4. Copy and paste the contents of `installation/install.txt`
5. Run the query
6. Create another query with the contents of `installation/seed.txt`
7. Run the query

## Admin Access

The first user to register will automatically become an admin. After registering, you'll be guided through the store setup process where you can configure:

1. Store information (name, contact details, etc.)
2. Payment processing (Stripe integration)
3. Product catalog
4. Store design and branding

## Development

### Project Structure

- `/src` - Source code
  - `/components` - Reusable UI components
  - `/pages` - Page components
  - `/lib` - Utility functions and hooks
  - `/hooks` - Custom React hooks
- `/public` - Static assets
- `/supabase` - Supabase configuration and migrations
  - `/migrations` - Database migrations
  - `/functions` - Edge functions for serverless operations

### Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint

## Deployment

### Deploying to Netlify

1. Push your code to a Git repository
2. Connect your repository to Netlify
3. Set the build command to `npm run build`
4. Set the publish directory to `dist`
5. Add your environment variables in the Netlify dashboard

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Vite](https://vitejs.dev/)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.io/)
- [Stripe](https://stripe.com/)
- [Lucide Icons](https://lucide.dev/)
- [shadcn/ui](https://ui.shadcn.com/)